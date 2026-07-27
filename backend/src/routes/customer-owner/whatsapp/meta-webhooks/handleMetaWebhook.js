const { PrismaClient } = require("../../../../generated/prisma/client");
const prisma = new PrismaClient();

const sendWhatsAppMessage = require("../../../../services/Meta/sendMessage");

const {
  buildTextPayload,
  buildMediaPayload,
  buildButtonPayload,
  buildListPayload,
  buildCtaPayload,
} = require("../../../../services/Meta/payloadBuilders");

const resolveTrigger = require("../../../../services/Meta/triggerResolver.service");
const handleTemplateStatusUpdate = require("../../../../services/Meta/handleTemplateStatusUpdate");
const buildTemplatePayload = require("../../../../services/Meta/buildTemplatePayload");

const normalizeIncomingMessage = require("../../../../services/Meta/normalizeIncomingMessage");

module.exports = async (req, res) => {
  // Meta requires immediate ACK
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    if (!entry) return;

    const change = entry.changes?.[0];
    if (!change) return;

    const value = change.value;
    if (!value) return;

    /* ================= TEMPLATE STATUS ================= */
    if (value.event === "message_template_status_update") {
      await handleTemplateStatusUpdate(value);
      return;
    }

    /* ================= INCOMING MESSAGE ================= */
    if (!value.messages || !value.messages.length) return;

    const message = value.messages[0];
    const from = message.from;
    const messageId = message.id;

    console.log("📩 Incoming message:", message.type, "from", from);

    /* ---------- DEDUPLICATION ---------- */
    const alreadyLogged = await prisma.messageLog.findFirst({
      where: { metaMessageId: messageId },
    });
    if (alreadyLogged) return;

    /* ---------- NORMALIZE ---------- */
    const normalized = normalizeIncomingMessage(message);

    const {
      text,
      buttonPayload,
      listPayload,
      media,
      location,
    } = normalized;

    /* ---------- FIND USER (MULTI-TENANT) ---------- */
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) return;

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        wabaVerification: {
          wabaPhoneId: phoneNumberId,
          status: "VERIFIED",
        },
      },
    });

    if (!user) return;

    /* ---------- CONTACT UPSERT ---------- */
    await prisma.contact.upsert({
      where: {
        accountId_phone: {
          accountId: user.accountId,
          phone: from,
        },
      },
      update: {},
      create: {
        accountId: user.accountId,
        phone: from,
      },
    });

    /* ---------- LOG INBOUND ---------- */
    await prisma.messageLog.create({
      data: {
        accountId: user.accountId,
        sentByUserId: null, // inbound
        to: from,
        metaMessageId: messageId,
        type: message.type.toUpperCase(),
        direction: "INBOUND",
        payload: message,
      },
    });

    /* ---------- ACTIVE BOT ---------- */
    const bot = await prisma.bot.findFirst({
      where: {
        accountId: user.accountId,
        isActive: true,
        isDeleted: false,
      },
      orderBy: { createdAt: "asc" },
    });
    if (!bot) return;

    /* ---------- SESSION (24h WINDOW) ---------- */
    let session = await prisma.botSession.findFirst({
      where: {
        accountId: user.accountId,
        botId: bot.id,
        contact: from,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      session = await prisma.botSession.create({
        data: {
          accountId: user.accountId,
          botId: bot.id,
          contact: from,
          botType: bot.botType,
          triggerType: "DEFAULT",
          currentNodeKey: bot.entryNodeKey || "START",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    /* ---------- TRIGGER RESOLUTION ---------- */
    const botReply = await prisma.botReply.findFirst({
      where: {
        botId: bot.id,
        isActive: true,
        parentNodeKey: session.currentNodeKey,
        OR: resolveTrigger({
          text,
          buttonPayload,
          listPayload,
          media, // allow media-based triggers too
        }),
      },
      include: {
        media: true,
        buttons: true,
        listMessage: {
          include: {
            sections: { include: { rows: true } },
          },
        },
        ctaButton: true,
        template: true, // for template replies
      },
    });

    if (!botReply) {
      const fallback = await sendWhatsAppMessage({
        phoneNumberId,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        to: from,
        payload: buildTextPayload(
          "Sorry, I didn’t understand that. Please try again."
        ),
      });

      return;
    }

    /* ---------- PAYLOAD BUILD ---------- */
    let payload;

    /* ===== TEMPLATE REPLY ===== */
    if (botReply.templateId && botReply.template) {
      // TODO: build real variables from contact/session
      const variables = ["Customer"];

      payload = buildTemplatePayload({
        template: botReply.template,
        to: from,
        variables,
      });
    } else {
      /* ===== NORMAL REPLIES ===== */

      if (botReply.replyType === "SIMPLE") {
        payload = buildTextPayload(botReply.bodyText);
      }

      if (botReply.replyType === "MEDIA" && botReply.media) {
        payload = buildMediaPayload({
          mediaType: botReply.media.mediaType,
          mediaId: botReply.media.metaMediaId,
          caption: botReply.bodyText,
        });
      }

      if (botReply.replyType === "INTERACTIVE") {
        if (botReply.interactiveType === "REPLY_BUTTONS") {
          payload = buildButtonPayload({
            bodyText: botReply.bodyText,
            buttons: botReply.buttons,
          });
        }

        if (botReply.interactiveType === "LIST") {
          payload = buildListPayload({
            bodyText: botReply.bodyText,
            buttonLabel: botReply.listMessage.buttonLabel,
            sections: botReply.listMessage.sections,
          });
        }

        if (botReply.interactiveType === "CTA_URL") {
          payload = buildCtaPayload({
            bodyText: botReply.bodyText,
            text: botReply.ctaButton.displayText,
            url: botReply.ctaButton.url,
          });
        }
      }
    }

    if (!payload) {
      console.log("No payload generated");
      return;
    }

    /* ---------- SESSION UPDATE ---------- */
    await prisma.botSession.update({
      where: { id: session.id },
      data: {
        previousNodeKey: session.currentNodeKey,
        currentNodeKey: botReply.nextNodeKey || session.currentNodeKey,
        isActive: !botReply.isEnd,
        lastMessageAt: new Date(),
      },
    });

    /* ---------- SEND ---------- */
    const sendResult = await sendWhatsAppMessage({
      phoneNumberId,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      to: from,
      payload,
    });

    /* ---------- LOG OUTBOUND ---------- */
    await prisma.messageLog.create({
      data: {
        accountId: user.accountId,
        sentByUserId: user.id,
        to: from,
        metaMessageId: sendResult?.messages?.[0]?.id ?? null,
        type: payload.type.toUpperCase(),
        direction: "OUTBOUND",
        payload,
      },
    });

  } catch (err) {
    console.error("Meta webhook error:", err);
  }
};