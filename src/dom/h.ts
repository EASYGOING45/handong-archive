export type Child = Node | string | number | null | undefined | false;
export type Props = Record<string, unknown>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'className') el.className = String(v);
    else if (k === 'style' && typeof v === 'object' && v !== null) {
      Object.assign(el.style, v as Record<string, string>);
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (v !== null && v !== undefined && v !== false) {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number'
      ? document.createTextNode(String(c))
      : c);
  }
  return el;
}

export function mount(root: HTMLElement, node: Node): void {
  root.replaceChildren(node);
}
