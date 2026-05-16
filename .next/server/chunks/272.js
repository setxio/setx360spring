exports.id=272,exports.ids=[272],exports.modules={28028:()=>{},30733:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(95491).A)("star",[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]])},56990:()=>{},71213:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(95491).A)("phone",[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]])},90272:(a,b,c)=>{"use strict";c.d(b,{l:()=>u});var d=c(21124),e=c(38301),f=c(47089),g=c(30733),h=c(69957),i=c(23673),j=c(15303),k=c(71213),l=c(44688),m=c(49407),n=c(97300),o=c(14263),p=c(59268),q=c(57724);c(28028);let r=({productId:a,currentUserId:b,avgRating:c,reviewCount:f})=>{let[h,i]=(0,e.useState)([]),[j,k]=(0,e.useState)(!0),[l,m]=(0,e.useState)(0),[n,r]=(0,e.useState)(""),[s,t]=(0,e.useState)(!1),[u,v]=(0,e.useState)(!1);(0,e.useEffect)(()=>{w()},[a]);let w=async()=>{k(!0);let{data:c,error:d}=await q.N.from("product_reviews").select(`
        *,
        profiles (
          name,
          avatar_url
        )
      `).eq("product_id",a).order("created_at",{ascending:!1});!d&&c&&(i(c),v(c.some(a=>a.profile_id===b))),k(!1)},x=async()=>{if(!b||0===l)return;t(!0);let{error:c}=await q.N.from("product_reviews").insert({product_id:a,profile_id:b,rating:l,comment:n,is_verified_purchase:!0});c||(m(0),r(""),w()),t(!1)},y=(a,b=!1)=>(0,d.jsx)("div",{className:"rating-stars",children:[1,2,3,4,5].map(c=>(0,d.jsx)("button",{type:"button",className:`star-btn ${c<=(b?l:a)?"active":""}`,onClick:()=>b&&m(c),disabled:!b,children:(0,d.jsx)(g.A,{fill:c<=(b?l:a)?"currentColor":"none",size:b?24:16})},c))});return(0,d.jsxs)("div",{className:"reviews-container",children:[(0,d.jsxs)("div",{className:"reviews-summary",children:[(0,d.jsxs)("div",{className:"overall-rating",children:[(0,d.jsx)("div",{className:"rating-number",children:c.toFixed(1)}),y(c),(0,d.jsxs)("div",{className:"rating-count",children:[f," reviews"]})]}),(0,d.jsx)("div",{className:"rating-bars",children:[5,4,3,2,1].map(a=>{let b=h.filter(b=>b.rating===a).length,c=f>0?b/f*100:0;return(0,d.jsxs)("div",{className:"rating-bar-row",children:[(0,d.jsxs)("span",{children:[a," stars"]}),(0,d.jsx)("div",{className:"bar-track",children:(0,d.jsx)("div",{className:"bar-fill",style:{width:`${c}%`}})}),(0,d.jsx)("span",{children:b})]},a)})})]}),!u&&b&&(0,d.jsxs)("div",{className:"add-review-section",children:[(0,d.jsx)("h3",{children:"Share your experience"}),(0,d.jsx)("p",{children:"How would you rate this product?"}),(0,d.jsx)("div",{className:"star-input",children:y(0,!0)}),(0,d.jsx)("textarea",{className:"review-textarea",placeholder:"What did you like or dislike? How's the quality?",rows:4,value:n,onChange:a=>r(a.target.value)}),(0,d.jsx)("button",{className:"submit-review-btn",onClick:x,disabled:s||0===l,children:s?(0,d.jsx)(o.A,{className:"animate-spin"}):"Post Review"})]}),(0,d.jsx)("div",{className:"review-list",children:j?(0,d.jsx)("div",{className:"discovery-loading",style:{height:"200px"},children:(0,d.jsx)(o.A,{className:"animate-spin",size:32,color:"var(--primary)"})}):h.map(a=>(0,d.jsxs)("div",{className:"review-item animate-fade-in",children:[(0,d.jsxs)("div",{className:"review-header",children:[(0,d.jsx)("img",{src:a.profiles.avatar_url||`https://ui-avatars.com/api/?name=${a.profiles.name}`,alt:a.profiles.name,className:"reviewer-avatar"}),(0,d.jsxs)("div",{className:"reviewer-info",children:[(0,d.jsxs)("div",{className:"reviewer-name",children:[a.profiles.name,a.is_verified_purchase&&(0,d.jsxs)("span",{className:"verified-badge",children:[(0,d.jsx)(p.A,{size:10})," Verified"]})]}),(0,d.jsx)("div",{className:"review-date",children:(a=>{let b=new Date(a),c=Math.floor((new Date().getTime()-b.getTime())/1e3);return c<60?"just now":c<3600?`${Math.floor(c/60)}m ago`:c<86400?`${Math.floor(c/3600)}h ago`:c<2592e3?`${Math.floor(c/86400)}d ago`:b.toLocaleDateString()})(a.created_at)})]}),y(a.rating)]}),(0,d.jsx)("p",{className:"review-comment",children:a.comment})]},a.id))})]})};var s=c(90039),t=c(4085);c(56990);let u=({product:a,user:b,onClose:c})=>{let[o,p]=(0,e.useState)(0),[q,u]=(0,e.useState)(!1);(0,e.useEffect)(()=>(document.body.style.overflow="hidden",()=>{document.body.style.overflow="unset"}),[]);let v=a.image_urls||["https://images.unsplash.com/photo-1544816155-12df9643f363?w=800","https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&hue=100","https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&sepia=1"],w=[{label:"Brand",value:a.brand||"Artisan Local"},{label:"Category",value:a.category||"Handcrafted"},{label:"Material",value:a.material||"Sustainable Mixed"},{label:"Dimensions",value:a.dimensions||"8 x 10 x 2 inches"},{label:"Weight",value:a.weight||"1.2 lbs"},{label:"Origin",value:"Southeast Texas, USA"}];return(0,d.jsx)(s.N,{children:(0,d.jsxs)("div",{className:"product-modal-overlay",onClick:c,children:[(0,d.jsxs)(t.P.div,{className:"product-modal-content",initial:{scale:.95,opacity:0,y:30},animate:{scale:1,opacity:1,y:0},exit:{scale:.95,opacity:0,y:30},transition:{type:"spring",damping:25,stiffness:300},onClick:a=>a.stopPropagation(),children:[(0,d.jsx)("button",{className:"close-modal-btn",onClick:c,"aria-label":"Close",children:(0,d.jsx)(f.A,{size:24})}),(0,d.jsxs)("div",{className:"product-modal-body",children:[(0,d.jsxs)("div",{className:"product-top-container",children:[(0,d.jsxs)("div",{className:"image-gallery-container",children:[(0,d.jsx)("div",{className:"thumbnails-list",children:v.map((a,b)=>(0,d.jsx)("img",{src:a,className:`thumb-item ${o===b?"active":""}`,onMouseEnter:()=>p(b),alt:`Thumbnail ${b}`},b))}),(0,d.jsx)("div",{className:"main-image-wrapper",children:(0,d.jsx)(t.P.img,{initial:{opacity:0},animate:{opacity:1},src:v[o],alt:a.name,className:"main-image-premium"},o)})]}),(0,d.jsxs)("div",{className:"core-details-wrapper",children:[(0,d.jsxs)("div",{className:"breadcrumb-mock",children:["Products › ",a.category||"Market"," › ",a.subcategory||"Specialty"]}),(0,d.jsx)("h1",{className:"product-title-premium",children:a.name}),(0,d.jsxs)("div",{className:"brand-link",children:["Visit the ",a.stores?.name||"Local Artisan"," Store"]}),(0,d.jsxs)("div",{className:"rating-row-amazon",children:[(0,d.jsx)("div",{className:"star-rating-summary",children:[1,2,3,4,5].map(b=>(0,d.jsx)(g.A,{size:16,fill:b<=Math.round(a.avg_rating||0)?"currentColor":"none",color:b<=Math.round(a.avg_rating||0)?"#f59e0b":"rgba(var(--text-muted-rgb), 0.2)"},b))}),(0,d.jsx)("span",{className:"rating-text",children:Number(a.avg_rating||0).toFixed(1)}),(0,d.jsxs)("span",{className:"review-text",children:[a.review_count||0," ratings"]})]}),(0,d.jsxs)("div",{className:"price-section-amazon",children:[(0,d.jsxs)("div",{style:{display:"flex",alignItems:"baseline"},children:[(0,d.jsx)("span",{className:"discount-badge-large",children:"-15%"}),(0,d.jsxs)("span",{className:"current-price-amazon",children:[(0,d.jsx)("small",{style:{fontSize:"1rem",verticalAlign:"top"},children:"$"}),a.price]})]}),(0,d.jsxs)("div",{className:"list-price-amazon",children:["List Price: $",(1.15*a.price).toFixed(2)]})]}),(0,d.jsxs)("div",{className:"about-item-section",children:[(0,d.jsx)("h4",{children:"About this item"}),(0,d.jsxs)("ul",{className:"about-list",children:[(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"HANDCRAFTED QUALITY:"})," Each piece is meticulously created by local SETX artisans, ensuring a unique and high-quality finish that mass-produced items can't match."]}),(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"LOCALLY SOURCED:"})," We prioritize materials found right here in the region, supporting local suppliers and reducing our environmental footprint."]}),(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"COMMUNITY IMPACT:"})," Your purchase directly contributes to the growth of local small businesses and independent creators in Southeast Texas."]}),(0,d.jsxs)("li",{children:[(0,d.jsx)("strong",{children:"DURABLE DESIGN:"})," Built to last using time-honored techniques passed down through generations of local makers."]})]})]})]}),(0,d.jsxs)("div",{className:"buy-box-container",children:[(0,d.jsxs)("div",{className:"buy-box-price",children:["$",a.price]}),(0,d.jsxs)("div",{className:"delivery-info-amazon",children:["Get ",(0,d.jsx)("strong",{children:"Fast, Free Shipping"})," with Local Express Delivery.",(0,d.jsx)("br",{}),"FREE delivery ",(0,d.jsx)("strong",{children:"Tomorrow, May 6"}),". Order within ",(0,d.jsx)("span",{style:{color:"#007600"},children:"3 hrs 45 mins"}),"."]}),(0,d.jsxs)("div",{className:"delivery-location",style:{fontSize:"0.8rem",display:"flex",alignItems:"center",gap:"6px",marginBottom:"16px",color:"var(--text-muted)"},children:[(0,d.jsx)(h.A,{size:14})," Deliver to ",b?.community||"Port Arthur"," ",b?.zip||"77642"]}),(0,d.jsx)("div",{className:"stock-status",children:"In Stock"}),(0,d.jsxs)("div",{className:"buy-box-actions",children:[(0,d.jsx)("button",{className:"amazon-btn btn-yellow",children:"Add to Cart"}),(0,d.jsx)("button",{className:"amazon-btn btn-orange",children:"Buy Now"})]}),(0,d.jsxs)("div",{className:"seller-info-amazon",children:[(0,d.jsxs)("div",{className:"seller-row",children:[(0,d.jsx)("span",{children:"Ships from"}),(0,d.jsx)("span",{children:"SETX Logistics"})]}),(0,d.jsxs)("div",{className:"seller-row",children:[(0,d.jsx)("span",{children:"Sold by"}),(0,d.jsx)("span",{children:a.stores?.name||"Local Artisan"})]}),(0,d.jsxs)("div",{className:"seller-row",children:[(0,d.jsx)("span",{children:"Returns"}),(0,d.jsx)("span",{children:"Eligible for Return or Replacement"})]}),(0,d.jsxs)("div",{className:"seller-row",children:[(0,d.jsx)("span",{children:"Payments"}),(0,d.jsx)("span",{children:"Secure transaction"})]})]}),(0,d.jsxs)("button",{style:{marginTop:"16px",background:"none",border:"none",color:"var(--primary)",fontWeight:700,fontSize:"0.8rem",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px"},children:[(0,d.jsx)(i.A,{size:14})," Add to List"]})]})]}),(0,d.jsxs)("div",{className:"extended-content-section",children:[(0,d.jsx)("h2",{className:"section-title",children:"Product Description"}),(0,d.jsxs)("div",{style:{display:"flex",gap:"40px",alignItems:"center"},children:[(0,d.jsx)("div",{style:{flex:1},children:(0,d.jsx)("p",{style:{lineHeight:1.8,fontSize:"1.1rem",color:"var(--text-muted)"},children:a.description||"Discover the essence of Southeast Texas craftsmanship. This product represents more than just a purchase; it's a piece of our community's heart and soul. Carefully designed to meet the highest standards of durability and aesthetics, it seamlessly blends traditional methods with modern needs."})}),(0,d.jsx)("div",{style:{flex:1},children:(0,d.jsx)("img",{src:v[0],style:{width:"100%",borderRadius:"24px",boxShadow:"0 20px 40px rgba(0,0,0,0.1)"},alt:"Feature"})})]})]}),(0,d.jsxs)("div",{className:"extended-content-section",children:[(0,d.jsx)("h2",{className:"section-title",children:"Product Information"}),(0,d.jsxs)("div",{className:"product-info-grid",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("h4",{children:"Technical Details"}),(0,d.jsx)("table",{className:"info-table",children:(0,d.jsx)("tbody",{children:w.slice(0,3).map((a,b)=>(0,d.jsxs)("tr",{children:[(0,d.jsx)("td",{children:a.label}),(0,d.jsx)("td",{children:a.value})]},b))})})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("h4",{children:"Additional Information"}),(0,d.jsx)("table",{className:"info-table",children:(0,d.jsx)("tbody",{children:w.slice(3).map((a,b)=>(0,d.jsxs)("tr",{children:[(0,d.jsx)("td",{children:a.label}),(0,d.jsx)("td",{children:a.value})]},b))})})]})]})]}),(0,d.jsxs)("div",{className:"extended-content-section bundle-section-amazon",children:[(0,d.jsx)("h2",{className:"section-title",children:"Frequently Bought Together"}),(0,d.jsxs)("div",{className:"bundle-grid-premium",children:[(0,d.jsxs)("div",{className:"bundle-items-flow",children:[(0,d.jsx)("div",{className:"bundle-item-box",children:(0,d.jsx)("img",{src:v[0],alt:"Current"})}),(0,d.jsx)("div",{className:"bundle-plus",children:"+"}),(0,d.jsxs)("div",{className:"bundle-item-box",children:[(0,d.jsx)("img",{src:"https://images.unsplash.com/photo-1585333127302-d29837a7b378?w=300",alt:"Related 1"}),(0,d.jsx)("div",{className:"bundle-item-label",children:"Local Artisan Stand"})]}),(0,d.jsx)("div",{className:"bundle-plus",children:"+"}),(0,d.jsxs)("div",{className:"bundle-item-box",children:[(0,d.jsx)("img",{src:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300",alt:"Related 2"}),(0,d.jsx)("div",{className:"bundle-item-label",children:"Premium Leather Sleeve"})]})]}),(0,d.jsxs)("div",{className:"bundle-checkout-card",children:[(0,d.jsxs)("div",{className:"bundle-total-price",children:[(0,d.jsx)("span",{children:"Total price:"}),(0,d.jsxs)("strong",{children:["$",(a.price+24.99+39.99).toFixed(2)]})]}),(0,d.jsx)("button",{className:"amazon-btn btn-yellow",children:"Add all three to Cart"}),(0,d.jsx)("p",{className:"bundle-disclaimer",children:"These items are often shipped separately by different local merchants."})]})]})]}),a.stores?.type==="physical"&&(0,d.jsxs)("div",{className:"extended-content-section physical-store-section",children:[(0,d.jsx)("h2",{className:"section-title",children:"Physical Store Information"}),(0,d.jsxs)("div",{className:"store-info-grid",children:[(0,d.jsxs)("div",{className:"store-contact-hours",children:[(0,d.jsxs)("div",{className:"info-card-premium",children:[(0,d.jsxs)("h4",{children:[(0,d.jsx)(j.A,{size:18})," Store Hours"]}),(0,d.jsxs)("ul",{className:"hours-list",children:[(0,d.jsxs)("li",{children:[(0,d.jsx)("span",{children:"Monday - Friday"})," ",(0,d.jsx)("span",{children:"9:00 AM - 7:00 PM"})]}),(0,d.jsxs)("li",{children:[(0,d.jsx)("span",{children:"Saturday"})," ",(0,d.jsx)("span",{children:"10:00 AM - 6:00 PM"})]}),(0,d.jsxs)("li",{children:[(0,d.jsx)("span",{children:"Sunday"})," ",(0,d.jsx)("span",{className:"closed-tag",children:"Closed"})]})]})]}),(0,d.jsxs)("div",{className:"info-card-premium",style:{marginTop:"20px"},children:[(0,d.jsxs)("h4",{children:[(0,d.jsx)(k.A,{size:18})," Contact & Support"]}),(0,d.jsx)("p",{style:{fontSize:"0.9rem",marginBottom:"16px",opacity:.8},children:"Have questions about this item or want to visit us in person?"}),(0,d.jsxs)("div",{style:{display:"flex",gap:"12px"},children:[(0,d.jsxs)("button",{className:"contact-btn secondary",onClick:()=>window.open("tel:4095550123"),children:[(0,d.jsx)(k.A,{size:16})," (409) 555-0123"]}),(0,d.jsxs)("button",{className:"contact-btn primary",onClick:()=>u(!0),children:[(0,d.jsx)(l.A,{size:16})," Message Shop"]})]})]})]}),(0,d.jsx)("div",{className:"store-location-map",children:(0,d.jsxs)("div",{className:"mock-map-container",children:[(0,d.jsxs)("div",{className:"map-overlay-info",children:[(0,d.jsx)(h.A,{size:20,color:"var(--primary)"}),(0,d.jsxs)("div",{children:[(0,d.jsx)("strong",{children:a.stores?.name}),(0,d.jsx)("p",{children:"123 Artisan Way, Port Arthur, TX 77642"})]})]}),(0,d.jsx)("img",{src:"https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=500&fit=crop",alt:"Store Location",className:"mock-map-img"}),(0,d.jsxs)("button",{className:"get-directions-btn",onClick:()=>window.open("https://maps.google.com"),children:[(0,d.jsx)(m.A,{size:16})," Get Directions"]})]})})]})]}),(0,d.jsxs)("div",{className:"extended-content-section",style:{background:"var(--bg)"},children:[(0,d.jsx)("h2",{className:"section-title",children:"Customer Reviews"}),(0,d.jsx)(r,{productId:a.id,currentUserId:b?.id,avgRating:a.avg_rating||0,reviewCount:a.review_count||0})]})]})]}),q&&(0,d.jsx)(n.W,{user:b,recipientId:a.stores?.owner_id,recipientName:a.stores?.name,recipientAvatar:a.stores?.image_url,onClose:()=>u(!1)})]})})}},97300:(a,b,c)=>{"use strict";c.d(b,{W:()=>l});var d=c(21124),e=c(38301),f=c(47089),g=c(14263),h=c(44688),i=c(71563),j=c(57724),k=c(24346);let l=({user:a,recipientId:b,recipientName:c,recipientAvatar:l,onClose:m})=>{let[n,o]=(0,e.useState)([]),[p,q]=(0,e.useState)(""),[r,s]=(0,e.useState)(!0),[t,u]=(0,e.useState)(!1),v=(0,e.useRef)(null);(0,e.useEffect)(()=>{w();let c=j.N.channel(`quick-msg-${b}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`or(and(sender_id.eq.${a.id},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a.id}))`},a=>{o(b=>[...b,a.new])}).subscribe();return()=>{j.N.removeChannel(c)}},[b]),(0,e.useEffect)(()=>{v.current?.scrollIntoView({behavior:"smooth"})},[n]);let w=async()=>{s(!0);let{data:c,error:d}=await j.N.from("messages").select("*").or(`and(sender_id.eq.${a.id},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a.id})`).order("created_at",{ascending:!0});!d&&c&&o(c),s(!1)},x=async()=>{if(!p.trim()||t)return;u(!0);let{error:c}=await j.N.from("messages").insert({sender_id:a.id,receiver_id:b,content:p.trim()});c||q(""),u(!1)};return(0,d.jsxs)("div",{className:"quick-message-overlay",onClick:m,children:[(0,d.jsxs)("div",{className:"quick-message-modal glass fade-in",onClick:a=>a.stopPropagation(),children:[(0,d.jsxs)("header",{className:"quick-msg-header",children:[(0,d.jsxs)("div",{className:"recipient-info",children:[(0,d.jsx)(k.e,{name:c,url:l,size:36}),(0,d.jsxs)("div",{className:"text-info",children:[(0,d.jsx)("h4",{children:c}),(0,d.jsx)("span",{className:"status-indicator online",children:"Message Shop"})]})]}),(0,d.jsx)("button",{className:"close-quick-msg",onClick:m,children:(0,d.jsx)(f.A,{size:20})})]}),(0,d.jsx)("div",{className:"quick-msg-body",children:r?(0,d.jsx)("div",{className:"msg-loading",children:(0,d.jsx)(g.A,{className:"animate-spin"})}):0===n.length?(0,d.jsxs)("div",{className:"empty-quick-msg",children:[(0,d.jsx)(h.A,{size:32}),(0,d.jsxs)("p",{children:["Start a conversation with ",(0,d.jsx)("strong",{children:c})]})]}):(0,d.jsxs)("div",{className:"quick-msg-list",children:[n.map(b=>(0,d.jsx)("div",{className:`quick-bubble ${b.sender_id===a.id?"sent":"received"}`,children:(0,d.jsx)("div",{className:"bubble-text",children:b.content})},b.id)),(0,d.jsx)("div",{ref:v})]})}),(0,d.jsxs)("footer",{className:"quick-msg-footer",children:[(0,d.jsx)("input",{type:"text",placeholder:"Type your message...",value:p,onChange:a=>q(a.target.value),onKeyDown:a=>"Enter"===a.key&&x()}),(0,d.jsx)("button",{className:"send-quick-btn",onClick:x,disabled:!p.trim()||t,children:t?(0,d.jsx)(g.A,{className:"animate-spin",size:18}):(0,d.jsx)(i.A,{size:18})})]})]}),(0,d.jsx)("style",{children:`
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