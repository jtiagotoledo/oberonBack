const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

exports.enviarSenhaTemporaria = async (destinatario, nome, senhaTemporaria) => {
  const mailOptions = {
    from: `"Muv Up Pilates" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Bem-vindo ao Muv Up - Seu primeiro acesso',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #63B887;">Olá, ${nome}!</h2>
        <p>Você foi cadastrado no sistema <strong>Muv Up</strong>.</p>
        <p>Utilize as credenciais abaixo para realizar o seu primeiro acesso ao aplicativo:</p>
        <div style="background-color: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>E-mail:</strong> ${destinatario}</p>
          <p style="margin: 0;"><strong>Senha temporária:</strong> <span style="font-size: 18px; font-weight: bold; color: #63B887;">${senhaTemporaria}</span></p>
        </div>
        <p>Recomendamos que você altere sua senha imediatamente após o primeiro login.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.enviarEmailRecuperacao = async (email, nome, linkReset) => {
  const mailOptions = {
    from: `"MUV Pilates" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperação de Senha - MUV Pilates',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <h2 style="color: #8C6E97;">Olá, ${nome}!</h2>
        <p>Recebemos uma solicitação para redefinir a sua senha de acesso.</p>
        <p>Clique no botão abaixo para escolher uma nova senha. Este link expira em <strong>15 minutos</strong>:</p>
        
        <p style="text-align: center; margin: 28px 0;">
          <a href="${linkReset}" 
             style="background-color: #63B887; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </p>
        
        <p style="font-size: 13px; color: #777;">
          Se você não solicitou a alteração de senha, ignore este e-mail. Sua senha permanecerá a mesma.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};