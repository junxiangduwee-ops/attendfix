/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['knex', 'pg', 'bcryptjs', 'node-cron', 'nodemailer', 'xlsx'],
  turbopack: {
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
}
export default nextConfig
