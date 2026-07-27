const parseJSONFields = (req, res, next) => {
    try {
        if (req.headers["content-type"]?.includes("multipart/form-data")) {

            const jsonFields = [
                "header",
                "footer",
                "buttons",
                "cta",
                "list",
                "location",
                "variableSamples",
                "locationDetails"
            ];

            jsonFields.forEach((field) => {
                if (req.body[field] && typeof req.body[field] === "string") {
                    req.body[field] = JSON.parse(req.body[field]);
                }
            });
        }

        next();
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            status: 0,
            message: "Invalid JSON format in form-data fields",
            statusCode: 400,
            data: {}
        });
    }
};

module.exports = parseJSONFields;
