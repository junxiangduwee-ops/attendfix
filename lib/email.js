export async function notifyMissingRecord(employee, date, hod) {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL] Missing record: ${employee.name} on ${date}`)
    return
  }
  // nodemailer implementation here when SMTP configured
}
export async function notifyHODApproval(cr, hod) {
  if (!process.env.SMTP_HOST) { console.log(`[EMAIL] HOD approval needed: cr#${cr.id}`); return }
}
export async function notifySubmissionConfirm(user, cr, hod) {
  if (!process.env.SMTP_HOST) { console.log(`[EMAIL] Submission confirmed: cr#${cr.id}`); return }
}
