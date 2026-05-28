import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  // Siempre loguear en consola para facilitar el desarrollo local
  console.log(`\n======================================================`);
  console.log(`[SIMULADOR DE EMAIL] Enviando correo a: ${email}`);
  console.log(`[CÓDIGO DE VERIFICACIÓN]: ${code}`);
  console.log(`======================================================\n`);

  // Verificar si SMTP está configurado
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Si no está configurado, simulamos éxito devolviendo true
    return true;
  }

  const mailOptions = {
    from: `"Task Manager" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Código de verificación de tu cuenta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5; text-align: center;">Verifica tu cuenta</h2>
        <p>Hola,</p>
        <p>Gracias por registrarte en Task Manager. Para verificar tu cuenta de correo electrónico, utiliza el siguiente código de un solo uso (OTP):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f3f4f6; border-radius: 5px; border: 1px dashed #4f46e5; color: #4f46e5;">
            ${code}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Este código expira en 15 minutos.</p>
        <p>Si no has creado esta cuenta, por favor ignora este correo.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Task Manager App</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return false;
  }
};
