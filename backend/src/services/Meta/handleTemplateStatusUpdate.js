const { PrismaClient } = require("../../generated/prisma/client");
const prisma = new PrismaClient();

module.exports = async function handleTemplateStatusUpdate(value) {
  try {
    const {
      message_template_id,
      message_template_name,
      message_template_language,
      status,
      reason
    } = value;

    if (!message_template_id) return;

    const template = await prisma.template.findFirst({
      where: {
        metaTemplateId: message_template_id
      }
    });

    if (!template) {
      console.log("Template not found for meta id:", message_template_id);
      return;
    }

    let newStatus = template.status;

    if (status === "APPROVED") newStatus = "APPROVED";
    if (status === "REJECTED") newStatus = "REJECTED";

    await prisma.template.update({
      where: { id: template.id },
      data: {
        status: newStatus,
        rejectReason: reason || null
      }
    });

    console.log("Template status updated:", template.name, status);

  } catch (err) {
    console.error("handleTemplateStatusUpdate error:", err);
  }
};
