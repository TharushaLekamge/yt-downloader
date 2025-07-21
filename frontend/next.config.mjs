export default {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:20000/:path*',
      },
    ];
  },
};