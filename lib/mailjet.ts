import Mailjet from 'node-mailjet'

const mj = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY!,
  apiSecret: process.env.MAILJET_SECRET_KEY!,
})

const FROM = { Email: 'noreply@firstshift.app', Name: 'First Shift' }

export async function sendFollowUpReminder(to: string, name: string, jobTitle: string, company: string) {
  await mj.post('send', { version: 'v3.1' }).request({
    Messages: [{
      From: FROM,
      To: [{ Email: to, Name: name }],
      Subject: `Time to follow up on ${company} 👋`,
      HTMLPart: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="margin-bottom:8px;">Hey ${name},</h2>
          <p style="color:#666;">You applied to <strong>${jobTitle} at ${company}</strong> a few days ago.</p>
          <p style="color:#666;">Most teens never follow up — that's exactly why you should. Walk in during off-peak hours, ask for the hiring manager, and say you applied online and wanted to check in.</p>
          <p style="color:#666;">That one move doubles your chances of getting called.</p>
          <a href="https://firstshift.app/dashboard/applied" style="display:inline-block;background:#E8A020;color:#0E0C09;font-weight:600;padding:12px 24px;border-radius:99px;text-decoration:none;margin-top:16px;">Mark as followed up →</a>
        </div>
      `,
    }],
  })
}

export async function sendNewMatchesEmail(to: string, name: string, count: number) {
  await mj.post('send', { version: 'v3.1' }).request({
    Messages: [{
      From: FROM,
      To: [{ Email: to, Name: name }],
      Subject: `${count} new job matches for you in Colorado Springs`,
      HTMLPart: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="margin-bottom:8px;">Hey ${name},</h2>
          <p style="color:#666;">We found <strong>${count} new jobs</strong> in Colorado Springs that fit your profile.</p>
          <a href="https://firstshift.app/dashboard" style="display:inline-block;background:#E8A020;color:#0E0C09;font-weight:600;padding:12px 24px;border-radius:99px;text-decoration:none;margin-top:16px;">See your matches →</a>
        </div>
      `,
    }],
  })
}
