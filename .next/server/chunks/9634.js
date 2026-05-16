exports.id=9634,exports.ids=[9634],exports.modules={9927:()=>{},29634:(a,b,c)=>{"use strict";c.r(b),c.d(b,{StoreFrontView:()=>r});var d=c(21124),e=c(38301),f=c(14263),g=c(79944),h=c(54937),i=c(30733),j=c(44688),k=c(88285),l=c(14674),m=c(71117),n=c(59405),o=c(57724),p=c(24346),q=c(97300);c(9927);let r=({storeId:a,onBack:b,currentUser:c})=>{let[r,s]=(0,e.useState)(null),[t,u]=(0,e.useState)([]),[v,w]=(0,e.useState)([]),[x,y]=(0,e.useState)(!0),[z,A]=(0,e.useState)(""),[B,C]=(0,e.useState)("All"),[D,E]=(0,e.useState)(!1),[F,G]=(0,e.useState)(!1);(0,e.useEffect)(()=>{H()},[a]);let H=async()=>{y(!0);try{let{data:b,error:c}=await o.N.from("stores").select("*").eq("id",a).single();if(c)throw c;s(b);let{data:d}=await o.N.from("products").select("*").eq("store_id",a).eq("status","active");d&&u(d);let{data:e}=await o.N.from("store_reviews").select("*, profiles(name, avatar_url)").eq("store_id",a).order("created_at",{ascending:!1});e&&w(e)}catch(a){console.error("Error fetching store data:",a)}finally{y(!1)}};if(x)return(0,d.jsx)("div",{className:"store-loader",children:(0,d.jsx)(f.A,{className:"animate-spin",size:48})});if(!r)return(0,d.jsx)("div",{className:"store-error",children:"Store not found."});let I=r.custom_theme||{},J=["All",...new Set(t.map(a=>a.category).filter(Boolean))],K=t.filter(a=>{let b=a.name.toLowerCase().includes(z.toLowerCase())||a.description?.toLowerCase().includes(z.toLowerCase()),c="All"===B||a.category===B;return b&&c}),L=v.length>0?(v.reduce((a,b)=>a+b.rating,0)/v.length).toFixed(1):"0.0",M=()=>{if(r.is_vacation_mode)return!1;let a=new Date,b=a.toLocaleDateString("en-US",{weekday:"long"}).toLowerCase(),c=r.business_hours?.[b];if(!c||c.closed||!c.open||!c.close)return!1;try{let[b,d]=[a.getHours(),a.getMinutes()],[e,f]=c.open.split(":").map(Number),[g,h]=c.close.split(":").map(Number),i=60*b+d;return i>=60*e+f&&i<=60*g+h}catch(a){return console.error("Error calculating store hours:",a),!1}},N={"--store-primary":I.primary_color||"#2563eb","--store-header-text":I.header_color||"#ffffff","--store-link":I.link_color||"#2563eb","--store-hover":I.hover_color||"#1d4ed8","--store-bg":I.bg_color||"#f8fafc","--store-bg-image":I.bg_image_url?`url(${I.bg_image_url})`:"none","--store-bg-style":"cover"===I.bg_style?"cover":"auto"};return(0,d.jsxs)("div",{className:"store-front-view",style:N,children:[(0,d.jsx)("div",{className:`store-bg-layer ${I.bg_style}`}),(0,d.jsxs)("header",{className:"store-header",children:[(0,d.jsxs)("div",{className:"store-banner",children:[r.banner_url?(0,d.jsx)("img",{src:r.banner_url,alt:"Banner",className:"banner-img"}):(0,d.jsx)("div",{className:"banner-placeholder"}),(0,d.jsx)("button",{className:"store-back-btn",onClick:b,children:(0,d.jsx)(g.A,{size:20})})]}),(0,d.jsxs)("div",{className:"store-profile-bar glass",children:[(0,d.jsxs)("div",{className:"store-branding",children:[(0,d.jsx)("div",{className:"store-logo-main",style:{width:80,height:80,borderRadius:"50%",overflow:"hidden",flexShrink:0,border:"3px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"},children:r.image_url?(0,d.jsx)("img",{src:r.image_url,alt:r.name,style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"},onError:a=>{a.target.style.display="none"}}):(0,d.jsx)("span",{style:{fontWeight:800,fontSize:"1.5rem",color:"var(--primary)"},children:(r.name||"S").charAt(0).toUpperCase()})}),(0,d.jsxs)("div",{className:"store-title-info",children:[(0,d.jsxs)("h1",{children:[r.name," ",r.is_verified&&(0,d.jsx)(h.A,{size:20,className:"verified-icon"})]}),(0,d.jsxs)("div",{className:"store-badges",children:[(0,d.jsx)("span",{className:`status-pill ${M()?"open":"closed"}`,children:M()?"Open Now":r.is_vacation_mode?"On Vacation":"Closed"}),(0,d.jsxs)("span",{className:"rating-pill",children:[(0,d.jsx)(i.A,{size:14,fill:"currentColor"})," ",L," (",v.length,")"]}),(0,d.jsx)("span",{className:"category-pill",children:r.category})]})]})]}),(0,d.jsx)("div",{className:"store-actions",children:(0,d.jsxs)("button",{className:"contact-vendor-btn",onClick:()=>G(!0),children:[(0,d.jsx)(j.A,{size:18})," Contact Shop"]})})]})]}),(0,d.jsxs)("main",{className:"store-content",children:[(0,d.jsxs)("div",{className:"store-filters-row",children:[(0,d.jsxs)("div",{className:"store-search-box glass",children:[(0,d.jsx)(k.A,{size:18}),(0,d.jsx)("input",{type:"text",placeholder:`Search in ${r.name}...`,value:z,onChange:a=>A(a.target.value)})]}),(0,d.jsx)("div",{className:"store-categories-pills",children:J.map(a=>(0,d.jsx)("button",{className:`cat-pill ${B===a?"active":""}`,onClick:()=>C(a),children:a},a))})]}),(0,d.jsx)("section",{className:"store-products-section",children:0===K.length?(0,d.jsxs)("div",{className:"no-products glass",children:[(0,d.jsx)(l.A,{size:48}),(0,d.jsx)("h3",{children:"No products found"}),(0,d.jsx)("p",{children:"Try adjusting your search or category filters."})]}):(0,d.jsx)("div",{className:"store-product-grid",children:K.map(a=>(0,d.jsxs)("div",{className:"store-product-card glass fade-in",children:[(0,d.jsx)("div",{className:"product-img-wrapper",children:(0,d.jsx)("img",{src:a.image_urls?.[0],alt:a.name})}),(0,d.jsxs)("div",{className:"product-details",children:[(0,d.jsx)("h4",{children:a.name}),(0,d.jsxs)("div",{className:"product-price-row",children:[(0,d.jsxs)("span",{className:"price",children:["$",a.price]}),(0,d.jsx)("button",{className:"add-to-cart-mini",children:(0,d.jsx)(l.A,{size:14})})]})]})]},a.id))})}),(0,d.jsxs)("section",{className:"store-info-grid",children:[(0,d.jsxs)("div",{className:"store-bio-card glass",children:[(0,d.jsx)("h3",{children:"About the Shop"}),(0,d.jsx)("p",{className:"store-bio-text",children:r.bio||"This shop hasn't shared their story yet."}),(0,d.jsxs)("div",{className:"store-hours-list",children:[(0,d.jsx)("h4",{children:"Business Hours"}),Object.entries(r.business_hours||{}).length>0?Object.entries(r.business_hours).map(([a,b])=>(0,d.jsxs)("div",{className:"hour-row",children:[(0,d.jsx)("span",{className:"day-label",children:a.charAt(0).toUpperCase()+a.slice(1)}),(0,d.jsx)("span",{className:"hour-val",children:!b||b.closed?"Closed":`${b.open||"09:00"} - ${b.close||"17:00"}`})]},a)):(0,d.jsx)("p",{className:"no-hours-info",children:"Hours not provided."})]})]}),(0,d.jsxs)("div",{className:"store-reviews-card glass",children:[(0,d.jsxs)("div",{className:"reviews-header",children:[(0,d.jsx)("h3",{children:"Reviews & Ratings"}),(0,d.jsx)(i.A,{size:24,fill:"var(--store-primary)",color:"var(--store-primary)"})]}),(0,d.jsx)("div",{className:"reviews-list",children:0===v.length?(0,d.jsx)("p",{className:"no-reviews",children:"Be the first to review this shop!"}):v.map(a=>(0,d.jsxs)("div",{className:"review-item",children:[(0,d.jsxs)("div",{className:"review-user",children:[(0,d.jsx)(p.e,{name:a.profiles?.name,url:a.profiles?.avatar_url,size:32}),(0,d.jsxs)("div",{className:"review-user-info",children:[(0,d.jsx)("strong",{children:a.profiles?.name}),(0,d.jsx)("div",{className:"review-stars",children:[void 0,void 0,void 0,void 0,void 0].map((b,c)=>(0,d.jsx)(i.A,{size:10,fill:c<a.rating?"var(--store-primary)":"none",color:"var(--store-primary)"},c))})]})]}),(0,d.jsx)("p",{className:"review-text",children:a.comment})]},a.id))})]})]}),(0,d.jsxs)("footer",{className:"store-footer-policies",children:[(0,d.jsxs)("button",{className:"policy-toggle-btn",onClick:()=>E(!D),children:[(0,d.jsx)(m.A,{size:16})," Returns & Policies ",(0,d.jsx)(n.A,{size:16,className:D?"rotated":""})]}),D&&(0,d.jsxs)("div",{className:"policy-content glass fade-in",children:[(0,d.jsx)("h4",{children:"Return Policy"}),(0,d.jsx)("p",{children:r.return_policy||"Contact the shop owner for details on their return policy."})]})]})]}),F&&(0,d.jsx)(q.W,{user:c,recipientId:r.owner_id,recipientName:r.name,recipientAvatar:r.image_url,onClose:()=>G(!1)})]})}},30733:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(95491).A)("star",[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]])},97300:(a,b,c)=>{"use strict";c.d(b,{W:()=>l});var d=c(21124),e=c(38301),f=c(47089),g=c(14263),h=c(44688),i=c(71563),j=c(57724),k=c(24346);let l=({user:a,recipientId:b,recipientName:c,recipientAvatar:l,onClose:m})=>{let[n,o]=(0,e.useState)([]),[p,q]=(0,e.useState)(""),[r,s]=(0,e.useState)(!0),[t,u]=(0,e.useState)(!1),v=(0,e.useRef)(null);(0,e.useEffect)(()=>{w();let c=j.N.channel(`quick-msg-${b}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`or(and(sender_id.eq.${a.id},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a.id}))`},a=>{o(b=>[...b,a.new])}).subscribe();return()=>{j.N.removeChannel(c)}},[b]),(0,e.useEffect)(()=>{v.current?.scrollIntoView({behavior:"smooth"})},[n]);let w=async()=>{s(!0);let{data:c,error:d}=await j.N.from("messages").select("*").or(`and(sender_id.eq.${a.id},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a.id})`).order("created_at",{ascending:!0});!d&&c&&o(c),s(!1)},x=async()=>{if(!p.trim()||t)return;u(!0);let{error:c}=await j.N.from("messages").insert({sender_id:a.id,receiver_id:b,content:p.trim()});c||q(""),u(!1)};return(0,d.jsxs)("div",{className:"quick-message-overlay",onClick:m,children:[(0,d.jsxs)("div",{className:"quick-message-modal glass fade-in",onClick:a=>a.stopPropagation(),children:[(0,d.jsxs)("header",{className:"quick-msg-header",children:[(0,d.jsxs)("div",{className:"recipient-info",children:[(0,d.jsx)(k.e,{name:c,url:l,size:36}),(0,d.jsxs)("div",{className:"text-info",children:[(0,d.jsx)("h4",{children:c}),(0,d.jsx)("span",{className:"status-indicator online",children:"Message Shop"})]})]}),(0,d.jsx)("button",{className:"close-quick-msg",onClick:m,children:(0,d.jsx)(f.A,{size:20})})]}),(0,d.jsx)("div",{className:"quick-msg-body",children:r?(0,d.jsx)("div",{className:"msg-loading",children:(0,d.jsx)(g.A,{className:"animate-spin"})}):0===n.length?(0,d.jsxs)("div",{className:"empty-quick-msg",children:[(0,d.jsx)(h.A,{size:32}),(0,d.jsxs)("p",{children:["Start a conversation with ",(0,d.jsx)("strong",{children:c})]})]}):(0,d.jsxs)("div",{className:"quick-msg-list",children:[n.map(b=>(0,d.jsx)("div",{className:`quick-bubble ${b.sender_id===a.id?"sent":"received"}`,children:(0,d.jsx)("div",{className:"bubble-text",children:b.content})},b.id)),(0,d.jsx)("div",{ref:v})]})}),(0,d.jsxs)("footer",{className:"quick-msg-footer",children:[(0,d.jsx)("input",{type:"text",placeholder:"Type your message...",value:p,onChange:a=>q(a.target.value),onKeyDown:a=>"Enter"===a.key&&x()}),(0,d.jsx)("button",{className:"send-quick-btn",onClick:x,disabled:!p.trim()||t,children:t?(0,d.jsx)(g.A,{className:"animate-spin",size:18}):(0,d.jsx)(i.A,{size:18})})]})]}),(0,d.jsx)("style",{children:`
        .quick-message-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .quick-message-modal {
          width: 380px;
          height: 500px;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .quick-msg-header {
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .recipient-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .text-info h4 { margin: 0; font-size: 0.95rem; }
        .status-indicator { font-size: 0.7rem; opacity: 0.6; display: flex; align-items: center; gap: 4px; }
        .status-indicator::before { content: ''; width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
        .close-quick-msg { background: none; border: none; color: var(--text-muted); cursor: pointer; }

        .quick-msg-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        .quick-msg-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .quick-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .quick-bubble.sent {
          align-self: flex-end;
          background: var(--store-primary, var(--primary));
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .quick-bubble.received {
          align-self: flex-start;
          background: rgba(255,255,255,0.08);
          color: var(--text);
          border-bottom-left-radius: 4px;
        }
        
        .empty-quick-msg {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.5;
          text-align: center;
          padding: 40px;
        }

        .quick-msg-footer {
          padding: 16px;
          display: flex;
          gap: 10px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .quick-msg-footer input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 16px;
          color: #fff;
          font-size: 0.9rem;
        }
        .send-quick-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--store-primary, var(--primary));
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .send-quick-btn:hover:not(:disabled) {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `})]})}}};