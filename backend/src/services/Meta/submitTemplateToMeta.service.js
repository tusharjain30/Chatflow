const axios = require("axios");

const submitTemplateToMeta = async (name, category, language, components) => {
    try {

        const url = `https://graph.facebook.com/${process.env.META_API_VERSION}/${process.env.META_WABA_ID}/message_templates`;

        const payload = {
            name,
            category,
            language,
            components
            // messaging_product: "whatsapp"
        };

        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("response:", response);
        return response.data;

    } catch (error) {
        console.error("DEBUG_META_ERROR_DETAILS:", error.response?.data);
        throw new Error(error?.response?.data?.error?.message || "Meta API error");
    }
};

module.exports = submitTemplateToMeta;