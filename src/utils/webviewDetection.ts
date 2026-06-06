export function isProbablyWebViewOrInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();

  // Heuristics: common signals from embedded webviews / in-app browsers.
  const webViewIndicators = [
    'wv', // Android System WebView
    'webview',
    'instagram',
    'line/',
    'fb_iab', // Facebook in-app browser
    'fbav',
    'twitter',
    'tiktok',
    'bytedance',
    'snapchat',
    'vk',
    'wechat',
    'micromessenger',
    'kakaotalk',
    'imo',
    'linkedin',
    'outlook',
    'messenger',
    'safari/',
    'chrome/',
  ];

  // Some UA patterns used specifically by iOS WKWebView wrappers.
  const iOSIndicators = ['iphone', 'ipad', 'ipod', 'ios'];

  const hits = webViewIndicators.some((token) => ua.includes(token));

  // If it looks like Safari + iOS + not normal Chrome/Android, it may still be in-app.
  const isIOS = iOSIndicators.some((t) => ua.includes(t));
  const isSafari = ua.includes('safari') && !ua.includes('chrome');
  const isAndroid = ua.includes('android');

  // Add a stronger condition for Android embedded browsers.
  const isAndroidEmbedded = isAndroid && (ua.includes('wv') || ua.includes('webview'));

  // iOS in-app browsers often look like Safari but also include other app tokens.
  // Since this is heuristic, we keep it conservative.
  return Boolean(isAndroidEmbedded || (hits && (isIOS || isAndroid)));
}

