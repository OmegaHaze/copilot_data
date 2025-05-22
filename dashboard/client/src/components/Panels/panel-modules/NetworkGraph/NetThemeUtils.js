// filepath: /workspace/dashboard/client/src/components/Panels/panel-modules/NetworkGraph/NetThemeUtils.js
// NetworkGraph/NetThemeUtils.js
export function getNetTheme() {
  const get = (className, prop = 'color') => {
    const el = document.createElement('div');
    el.className = className;
    document.body.appendChild(el);
    const color = getComputedStyle(el)[prop];
    document.body.removeChild(el);
    return color;
  };

  return {
    primary: get('crt-text5'),
    secondary: get('crt-text4'),
    tertiary: get('crt-text3'),
    quaternary: get('crt-text2'),
    danger: 'rgb(220, 38, 38)',
    warning: 'rgb(234, 179, 8)',
    selection: get('crt-text4')
  };
}
