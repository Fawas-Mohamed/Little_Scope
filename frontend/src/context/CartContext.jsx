import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { flavours, toppings, unitPrice } from '../data/flavours.js';

const KEY = 'littlescoop.cart';
const Ctx = createContext(null);
const validSizes = new Set(['small', 'regular', 'large']);
const validToppings = new Set(toppings.map((item) => item.id));
const load = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!Array.isArray(stored)) return [];
    return stored.filter((line) => line && flavours.some((flavour) => flavour.id === line.flavourId))
      .map((line) => ({
        flavourId: line.flavourId,
        size: validSizes.has(line.size) ? line.size : 'regular',
        toppings: Array.isArray(line.toppings) ? [...new Set(line.toppings.filter((id) => validToppings.has(id)))] : [],
        qty: Math.max(1, Math.min(20, Number.isFinite(Number(line.qty)) ? Math.trunc(Number(line.qty)) : 1)),
      }));
  } catch { return []; }
};
const lineKey = (l) => `${l.flavourId}|${l.size}|${(Array.isArray(l.toppings) ? l.toppings : []).slice().sort().join(',')}`;

function reducer(lines, a) {
  switch (a.type) {
    case 'add': {
      const key = lineKey(a.line);
      const hit = lines.find((l) => l.key === key);
      return hit ? lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + a.line.qty) } : l)) : [...lines, { ...a.line, key }];
    }
    case 'qty': return lines.map((l) => (l.key === a.key ? { ...l, qty: Math.max(1, Math.min(20, a.qty)) } : l));
    case 'remove': return lines.filter((l) => l.key !== a.key);
    case 'clear': return [];
    default: return lines;
  }
}

export function CartProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ } }, [lines]);
  const value = useMemo(() => {
    const priced = lines.map((l) => { const flavour = flavours.find((f) => f.id === l.flavourId); return { ...l, flavour, unit: unitPrice(flavour, l.size, l.toppings) }; });
    return {
      lines: priced,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: priced.reduce((n, l) => n + l.unit * l.qty, 0),
      add: (line) => dispatch({ type: 'add', line }),
      setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
      remove: (key) => dispatch({ type: 'remove', key }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, [lines]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCart = () => useContext(Ctx);
