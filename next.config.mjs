/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcryptjs', '@prisma/client', 'node-cron', 'nodemailer'],
}
export default nextConfig
