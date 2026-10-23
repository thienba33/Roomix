/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  // Run the same Tailwind loader before Next's CSS loaders in Webpack fallback builds.
  webpack(config) {
    const addTailwind = (rules) => {
      for (const rule of rules) {
        if (!rule || typeof rule !== 'object') continue;
        if (Array.isArray(rule.use) && rule.use.some((entry) =>
          typeof entry?.loader === 'string' && entry.loader.includes('/css-loader/'))) {
          rule.use.push({ loader: '@tailwindcss/turbopack' });
        }
        if (rule.oneOf) addTailwind(rule.oneOf);
        if (rule.rules) addTailwind(rule.rules);
      }
    };
    addTailwind(config.module.rules);
    return config;
  },
  async redirects() {
    return [
      // Tenant (old Vietnamese slugs -> English)
      { source: '/yeu-thich', destination: '/favorites', permanent: false },
      { source: '/yeu-cau', destination: '/requests', permanent: false },
      { source: '/trang-thai', destination: '/states', permanent: false },
      { source: '/phong/:id', destination: '/rooms/:id', permanent: false },
      // Landlord
      { source: '/chu-tro', destination: '/landlord', permanent: false },
      { source: '/chu-tro/phong', destination: '/landlord/rooms', permanent: false },
      { source: '/chu-tro/bai-dang', destination: '/landlord/listings', permanent: false },
      { source: '/chu-tro/bai-dang/tao', destination: '/landlord/listings/create', permanent: false },
      { source: '/chu-tro/yeu-cau', destination: '/landlord/requests', permanent: false },
      { source: '/chu-tro/khach-thue', destination: '/landlord/tenants', permanent: false },
      { source: '/chu-tro/hoa-don', destination: '/landlord/invoices', permanent: false },
      { source: '/chu-tro/thong-ke', destination: '/landlord/statistics', permanent: false },
      { source: '/chu-tro/thong-bao', destination: '/landlord/notifications', permanent: false },
      { source: '/chu-tro/ho-so', destination: '/landlord/profile', permanent: false },
      { source: '/chu-tro/dang-nhap', destination: '/login?role=landlord', permanent: false },
      // Admin
      { source: '/admin/dang-nhap', destination: '/admin/login', permanent: false },
      { source: '/admin/kiem-duyet', destination: '/admin/moderation', permanent: false },
      { source: '/admin/kiem-duyet/:id', destination: '/admin/moderation/:id', permanent: false },
      { source: '/admin/nguoi-dung', destination: '/admin/users', permanent: false },
      { source: '/admin/bao-cao', destination: '/admin/reports', permanent: false },
      { source: '/admin/thong-bao', destination: '/admin/notifications', permanent: false },
    ];
  },
};
export default nextConfig;
