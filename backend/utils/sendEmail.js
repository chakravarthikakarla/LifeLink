const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, html) => {
  if (!process.env.BREVO_API_KEY) {
    const message = "BREVO_API_KEY is not set in environment variables";
    console.error(message);
    throw new Error(message);
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) {
    const message = "BREVO_SENDER_EMAIL is not set in environment variables";
    console.error(message);
    throw new Error(message);
  }

  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: senderEmail,
        name: "LifeLink",
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    });

    console.log("Email sent (Brevo):", response);

    if (response && response.messageId) {
      return { ok: true, info: response };
    }

    const failMessage = `Brevo sendTransacEmail did not return messageId: ${JSON.stringify(response)}`;
    console.error(failMessage);
    throw new Error(failMessage);
  } catch (error) {
    const details = error.response?.body || error.message || error;
    console.error("Brevo Email Error: ", details);
    throw new Error(`Brevo Email Error: ${JSON.stringify(details)}`);
  }
};

module.exports = sendEmail;
