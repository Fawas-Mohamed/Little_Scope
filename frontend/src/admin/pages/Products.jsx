import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../store/AdminStore.jsx';
import { CATEGORIES } from '../store/seed.js';
import { money, go, usePager, uid, downloadCSV } from '../ui/util.js';
import Icon from '../ui/Icon.jsx';
import { Badge, Toggle, Pager, Empty, Modal, Confirm, Field } from '../ui/kit.jsx';

const blank = () => ({ id: '', name: '', sku: '', category: 'Classic', price: '', cost: '', stock: '', status: 'active', popular: false, color: '#F4E2AE', description: '', image: '', flavourId: null });

// downscale uploads so the demo data stays small enough for localStorage
function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Could not read the file.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be opened.'));
      img.onload = () => {
        const s = Math.min(1, 640 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        let url = c.toDataURL('image/webp', .85); if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/png');
        resolve(url);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

const Thumb = ({ p, size = 44 }) => (
  <span className="a-thumb" style={{ width: size, height: size, background: p.image ? '#F7E7E1' : `linear-gradient(135deg, ${p.color}, ${p.color}aa)` }}>{p.image ? <img src={p.image} alt="" /> : <Icon name="products" size={size * .45} />}</span>
);

function ProductForm({ product, onClose }) {
  const { products, settings, dispatch, toast } = useAdmin();
  const editing = !!product?.id;
  const [f, setF] = useState(blank()), [err, setErr] = useState({}), [imgErr, setImgErr] = useState(''), file = useRef(null);
  useEffect(() => { if (product) { setF({ ...blank(), ...product, price: String(product.price ?? ''), cost: String(product.cost ?? ''), stock: String(product.stock ?? '') }); setErr({}); setImgErr(''); } }, [product]);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setErr((e) => ({ ...e, [k]: '' })); };
  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.name.trim().length < 2) er.name = 'Enter a product name.';
    if (!(parseFloat(f.price) > 0)) er.price = 'Enter a price above 0.';
    if (f.cost !== '' && !(parseFloat(f.cost) >= 0)) er.cost = 'Cost must be 0 or more.';
    if (!(parseInt(f.stock, 10) >= 0)) er.stock = 'Enter a stock quantity.';
    const sku = (f.sku || `LS-${f.name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`).trim();
    if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== f.id)) er.sku = 'This SKU already exists.';
    setErr(er); if (Object.keys(er).length) return;
    dispatch({ type: 'product/save', product: { ...f, id: f.id || uid('P'), name: f.name.trim(), sku, price: +parseFloat(f.price).toFixed(2), cost: +(parseFloat(f.cost) || 0).toFixed(2), stock: parseInt(f.stock, 10), createdAt: f.createdAt || new Date().toISOString() } });
    toast(editing ? `${f.name} updated` : `${f.name} added`); onClose();
  };
  const pick = async (e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (!fl) return; try { set('image', await readImage(fl)); setImgErr(''); } catch (x) { setImgErr(x.message); } };
  return (
    <Modal open={!!product} onClose={onClose} title={editing ? 'Edit product' : 'Add product'} subtitle={editing ? f.sku : 'Create a new flavour for your menu'} width="680px"
      footer={<><button className="a-btn ghost" onClick={onClose}>Cancel</button><button className="a-btn" form="product-form" type="submit">{editing ? 'Save changes' : 'Add product'}</button></>}>
      <form id="product-form" className="a-form" onSubmit={submit} noValidate>
        <div className="a-media">
          <Thumb p={f} size={96} />
          <div><b>Product image</b><small>PNG, JPG or WebP. Transparent PNGs look best.</small>
            <div className="row"><button type="button" className="a-btn ghost sm" onClick={() => file.current.click()}><Icon name="image" size={16} />{f.image ? 'Replace' : 'Upload'}</button>{f.image && <button type="button" className="a-btn ghost sm danger-t" onClick={() => set('image', '')}>Remove</button>}</div>
            {imgErr && <small className="err">{imgErr}</small>}<input ref={file} type="file" accept="image/*" hidden onChange={pick} />
          </div>
        </div>
        <Field label="Name" error={err.name} className="full"><input className="a-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Salted Caramel" /></Field>
        <Field label="Category"><select className="a-input" value={f.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="SKU" error={err.sku} hint="Leave empty to generate"><input className="a-input" value={f.sku} onChange={(e) => set('sku', e.target.value)} placeholder="LS-XXX-000" /></Field>
        <Field label={`Price (${settings.currency})`} error={err.price}><input className="a-input" inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="6.50" /></Field>
        <Field label={`Cost (${settings.currency})`} error={err.cost}><input className="a-input" inputMode="decimal" value={f.cost} onChange={(e) => set('cost', e.target.value)} placeholder="2.40" /></Field>
        <Field label="Stock" error={err.stock}><input className="a-input" inputMode="numeric" value={f.stock} onChange={(e) => set('stock', e.target.value)} placeholder="50" /></Field>
        <Field label="Status"><select className="a-input" value={f.status} onChange={(e) => set('status', e.target.value)}><option value="active">Active (visible)</option><option value="draft">Draft (hidden)</option></select></Field>
        <Field label="Flavour colour"><span className="a-color"><input type="color" value={f.color} onChange={(e) => set('color', e.target.value)} /><code>{f.color.toUpperCase()}</code></span></Field>
        <div className="a-field"><span>Badge</span><label className="a-check"><input type="checkbox" checked={f.popular} onChange={(e) => set('popular', e.target.checked)} />Mark as popular</label></div>
        <Field label="Description" className="full"><textarea className="a-input" rows="3" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="A short, mouth-watering description" /></Field>
      </form>
    </Modal>
  );
}

export default function Products({ id }) {
  const { products, orders, settings, dispatch, toast } = useAdmin();
  const [q, setQ] = useState(''), [cat, setCat] = useState('all'), [st, setSt] = useState('all'), [view, setView] = useState(() => localStorage.getItem('ls.admin.pview') || 'table');
  const [edit, setEdit] = useState(null), [del, setDel] = useState(null);
  const sold = useMemo(() => { const m = {}; orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded').forEach((o) => o.items.forEach((i) => { m[i.productId] = (m[i.productId] || 0) + i.qty; })); return m; }, [orders]);
  const rows = useMemo(() => { const t = q.trim().toLowerCase(); return products.filter((p) => (cat === 'all' || p.category === cat) && (st === 'all' || (st === 'low' ? p.stock <= settings.lowStockLevel : p.status === st)) && (!t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t))); }, [products, q, cat, st, settings.lowStockLevel]);
  const pg = usePager(rows, view === 'grid' ? 12 : 10);
  useEffect(() => pg.setPage(1), [q, cat, st, view]); // eslint-disable-line
  useEffect(() => { if (id) { const p = products.find((x) => x.id === id); if (p) setEdit(p); go('/admin/products'); } }, [id]); // eslint-disable-line
  const setV = (v) => { setView(v); localStorage.setItem('ls.admin.pview', v); };
  const toggle = (p, status) => { dispatch({ type: 'product/save', product: { ...p, status } }); toast(`${p.name} is now ${status}`); };
  const exportCsv = () => { downloadCSV('products.csv', [['SKU', 'Name', 'Category', 'Price', 'Cost', 'Stock', 'Status', 'Sold'], ...rows.map((p) => [p.sku, p.name, p.category, p.price, p.cost, p.stock, p.status, sold[p.id] || 0])]); toast(`Exported ${rows.length} products`); };
  const Stock = ({ p }) => (
    <span className="a-stock"><button aria-label={`Remove one ${p.name}`} onClick={(e) => { e.stopPropagation(); dispatch({ type: 'product/stock', id: p.id, delta: -1 }); }}>−</button>
      <b className={p.stock === 0 ? 'out' : p.stock <= settings.lowStockLevel ? 'low' : ''}>{p.stock}</b>
      <button aria-label={`Add one ${p.name}`} onClick={(e) => { e.stopPropagation(); dispatch({ type: 'product/stock', id: p.id, delta: 1 }); }}>+</button></span>
  );

  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Products</h1><p>{products.length} flavours · {products.filter((p) => p.status === 'active').length} active</p></div>
        <div className="a-head-actions"><button className="a-btn ghost" onClick={exportCsv}><Icon name="download" size={17} />Export</button><button className="a-btn" onClick={() => setEdit(blank())}><Icon name="plus" size={18} />Add product</button></div></div>
      <section className="a-card flush">
        <div className="a-toolbar">
          <label className="a-input-ico"><Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU" aria-label="Search products" /></label>
          <select className="a-input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="a-input" value={st} onChange={(e) => setSt(e.target.value)} aria-label="Status"><option value="all">All status</option><option value="active">Active</option><option value="draft">Draft</option><option value="low">Low stock</option></select>
          <div className="a-seg sm" role="group" aria-label="View"><button className={view === 'table' ? 'on' : ''} onClick={() => setV('table')}>Table</button><button className={view === 'grid' ? 'on' : ''} onClick={() => setV('grid')}>Grid</button></div>
        </div>
        {rows.length === 0 ? <Empty icon="products" title="No products found" text="Adjust your filters or add a new product." /> : view === 'grid' ? (
          <div className="a-pgrid">{pg.slice.map((p) => (
            <article className="a-pcard" key={p.id}>
              <div className="pic" style={{ background: p.image ? '#F7E7E1' : `linear-gradient(135deg, ${p.color}55, ${p.color}22)` }}>{p.image ? <img src={p.image} alt="" /> : <span style={{ background: p.color }} />}{p.popular && <i>Popular</i>}<Badge>{p.status === 'active' ? 'Active' : 'Draft'}</Badge></div>
              <div className="meta"><h3>{p.name}</h3><small>{p.category} · {p.sku}</small>
                <div className="row"><b>{money(p.price, settings.currency)}</b><Stock p={p} /></div>
                <div className="row act"><Toggle checked={p.status === 'active'} onChange={(v) => toggle(p, v ? 'active' : 'draft')} label={`${p.name} active`} /><span><button className="a-icon-btn" onClick={() => setEdit(p)} aria-label={`Edit ${p.name}`}><Icon name="edit" size={17} /></button><button className="a-icon-btn" onClick={() => setDel(p)} aria-label={`Delete ${p.name}`}><Icon name="trash" size={17} /></button></span></div></div>
            </article>))}</div>
        ) : (
          <div className="a-table-wrap"><table className="a-table stack">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Active</th><th /></tr></thead>
            <tbody>{pg.slice.map((p) => (
              <tr key={p.id}>
                <td data-label="Product"><span className="who"><Thumb p={p} /><span><b>{p.name}{p.popular && <em className="pop">Popular</em>}</b><small>{p.sku}</small></span></span></td>
                <td data-label="Category">{p.category}</td>
                <td data-label="Price"><b>{money(p.price, settings.currency)}</b><small>cost {money(p.cost, settings.currency)}</small></td>
                <td data-label="Stock"><Stock p={p} /></td><td data-label="Sold">{sold[p.id] || 0}</td>
                <td data-label="Active"><Toggle checked={p.status === 'active'} onChange={(v) => toggle(p, v ? 'active' : 'draft')} label={`${p.name} active`} /></td>
                <td className="act"><button className="a-icon-btn" onClick={() => setEdit(p)} aria-label={`Edit ${p.name}`}><Icon name="edit" size={17} /></button><button className="a-icon-btn" onClick={() => setDel(p)} aria-label={`Delete ${p.name}`}><Icon name="trash" size={17} /></button></td>
              </tr>))}</tbody>
          </table></div>
        )}
        <Pager p={pg} />
      </section>
      <ProductForm product={edit} onClose={() => setEdit(null)} />
      <Confirm open={!!del} title="Delete product?" message={`“${del?.name}” will be removed from your menu. Past orders keep their history.`} onConfirm={() => { dispatch({ type: 'product/delete', id: del.id }); toast(`${del.name} deleted`); }} onClose={() => setDel(null)} />
    </div>
  );
}
