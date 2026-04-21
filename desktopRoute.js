/* PEGASUS DEVICE ROUTING PROTOCOL v16.0 */
const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobileAgent && !window.location.pathname.includes('/mobile/')) {
  window.location.replace('mobile/mobile.html' + window.location.search + window.location.hash);
}
