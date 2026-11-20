import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../store/AdminStore.jsx';
import { fmtDate, usePager } from '../ui/util.js';
import Icon from '../ui/Icon.jsx';
import { Badge, Avatar, Pager, Empty, Stars, Confirm } from '../ui/kit.jsx';

export default function Reviews() {
  const { reviews, dispatch, toast } = useAdmin();
  const [tab, setTab] = useState('all'), [rating, setRating] = useState(0), [q, setQ] = useState(''), [reply, setReply] = useState(null), [text, setText] = useState(''), [del, setDel] = useState(null);
  const counts = useMemo(() => ({ all: reviews.length, pending: reviews.filter((r) => r.status === 'pending').length, approved: reviews.filter((r) => r.status === 'approved').length, hidden: reviews.filter((r) => r.status === 'hidden').length }), [reviews]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  const rows = useMemo(() => { const t = q.trim().toLowerCase(); return reviews.filter((r) => (tab === 'all' || r.status === tab) && (!rating || r.rating === rating) && (!t || r.text.toLowerCase().includes(t) || r.customer.toLowerCase().includes(t) || r.productName.toLowerCase().includes(t))); }, [reviews, tab, rating, q]);
  const pg = usePager(rows, 6);
  useEffect(() => pg.setPage(1), [tab, rating, q]); // eslint-disable-line
  const setStatus = (r, status) => { dispatch({ type: 'review/update', id: r.id, patch: { status } }); toast(status === 'approved' ? 'Review approved' : 'Review hidden'); };
  const send = (r) => { if (!text.trim()) return; dispatch({ type: 'review/update', id: r.id, patch: { reply: text.trim() } }); toast('Reply published'); setReply(null); setText(''); };

  return (
    <div className="a-page">
      <div className="a-page-head"><div><h1>Reviews</h1><p>Approve, reply to or hide what customers are saying.</p></div></div>
      <div className="a-grid g-sum">
        <section className="a-card rating-card"><div className="big"><b>{avg.toFixed(1)}</b><Stars n={Math.round(avg)} /><small>{reviews.length} reviews</small></div>
          <div className="bars">{dist.map((d) => <button key={d.n} className={rating === d.n ? 'on' : ''} onClick={() => setRating(rating === d.n ? 0 : d.n)} aria-label={`${d.n} star reviews`}><span>{d.n}★</span><i><u style={{ width: `${reviews.length ? (d.c / reviews.length) * 100 : 0}%` }} /></i><em>{d.c}</em></button>)}</div></section>
        <section className="a-card flush grow-col">
          <div className="a-tabs" role="tablist">{[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['hidden', 'Hidden']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}<b>{counts[k]}</b></button>)}</div>
          <div className="a-toolbar"><label className="a-input-ico"><Icon name="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews" aria-label="Search reviews" /></label>{rating > 0 && <button className="a-chip" onClick={() => setRating(0)}>{rating} stars<Icon name="close" size={14} /></button>}</div>
          {rows.length === 0 ? <Empty icon="reviews" title="No reviews here" text="Nothing matches this filter." /> : (
            <ul className="a-reviews">{pg.slice.map((r) => (
              <li key={r.id}>
                <div className="head"><Avatar name={r.customer} size={40} /><span className="grow"><b>{r.customer}</b><small>{r.productName} · {fmtDate(r.createdAt)}</small></span><Stars n={r.rating} /><Badge>{r.status === 'approved' ? 'Approved' : r.status === 'hidden' ? 'Hidden' : 'Pending'}</Badge></div>
                <p className="txt">“{r.text}”</p>
                {r.reply && <div className="reply"><Icon name="reply" size={15} /><span><b>Your reply</b>{r.reply}</span></div>}
                {reply === r.id && <div className="reply-box"><textarea className="a-input" rows="2" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a friendly reply" /><div><button className="a-btn sm" onClick={() => send(r)}>Publish reply</button><button className="a-btn ghost sm" onClick={() => { setReply(null); setText(''); }}>Cancel</button></div></div>}
                <div className="actions">
                  {r.status !== 'approved' && <button className="a-btn sm" onClick={() => setStatus(r, 'approved')}><Icon name="check" size={15} />Approve</button>}
                  {r.status !== 'hidden' && <button className="a-btn ghost sm" onClick={() => setStatus(r, 'hidden')}><Icon name="eye" size={15} />Hide</button>}
                  <button className="a-btn ghost sm" onClick={() => { setReply(r.id); setText(r.reply || ''); }}><Icon name="reply" size={15} />{r.reply ? 'Edit reply' : 'Reply'}</button>
                  <button className="a-btn ghost sm danger-t" onClick={() => setDel(r)}><Icon name="trash" size={15} />Delete</button>
                </div>
              </li>))}</ul>
          )}
          <Pager p={pg} />
        </section>
      </div>
      <Confirm open={!!del} title="Delete review?" message="This review will be permanently removed." onConfirm={() => { dispatch({ type: 'review/delete', id: del.id }); toast('Review deleted'); }} onClose={() => setDel(null)} />
    </div>
  );
}
