interface EmailData {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  console.log('========================================');
  console.log('📧 EMAIL SERVICE (STUB)');
  console.log('========================================');
  console.log(`To: ${data.to}`);
  console.log(`Subject: ${data.subject}`);
  console.log(`Body: ${data.body.substring(0, 200)}...`);
  if (data.cc?.length) console.log(`CC: ${data.cc.join(', ')}`);
  if (data.bcc?.length) console.log(`BCC: ${data.bcc.join(', ')}`);
  if (data.attachments?.length) console.log(`Attachments: ${data.attachments.length} file(s)`);
  console.log('========================================');

  return true;
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  return sendEmail({
    to,
    subject: 'Réinitialisation de mot de passe - EROSIS CERTIFY',
    body: `
      <h1>Réinitialisation de mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Ce lien est valable 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      <hr>
      <p>EROSIS CERTIFY - Plateforme de gestion de certificats</p>
    `,
  });
}
