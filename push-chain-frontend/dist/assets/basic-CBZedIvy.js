import{i as M,C as K,A as N,O as q,a as B,b as L,c as Ge,x as u,E as F,R as P,d as z,e as Qt,f as ve,g as we,H as Zn,r as G,h as he,T as Ot,S as ze,M as Pn,j as Bn,k as Ln,l as Nn,m as Me,n as ge,o as ei,p as ti,q as Yt,s as On,W as Dt}from"./core-Cq0IuG5c.js";import{n as d,r as T,c as O,o as j,U as ce,i as ni,t as ii,e as ri}from"./index-BQW6JIPN.js";import{a as oi}from"./index-C1wngyGl.js";var Le=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let $e=class extends M{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=K.state.connectors,this.count=N.state.count,this.filteredCount=N.state.filteredWallets.length,this.isFetchingRecommendedWallets=N.state.isFetchingRecommendedWallets,this.unsubscribe.push(K.subscribeKey("connectors",t=>this.connectors=t),N.subscribeKey("count",t=>this.count=t),N.subscribeKey("filteredWallets",t=>this.filteredCount=t.length),N.subscribeKey("isFetchingRecommendedWallets",t=>this.isFetchingRecommendedWallets=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){const t=this.connectors.find(c=>c.id==="walletConnect"),{allWallets:i}=q.state;if(!t||i==="HIDE"||i==="ONLY_MOBILE"&&!B.isMobile())return null;const r=N.state.featured.length,o=this.count+r,n=o<10?o:Math.floor(o/10)*10,s=this.filteredCount>0?this.filteredCount:n;let a=`${s}`;this.filteredCount>0?a=`${this.filteredCount}`:s<o&&(a=`${s}+`);const l=L.hasAnyConnection(Ge.CONNECTOR_ID.WALLET_CONNECT);return u`
      <wui-list-wallet
        name="Search Wallet"
        walletIcon="search"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${a}
        tagVariant="info"
        data-testid="all-wallets"
        tabIdx=${j(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        ?disabled=${l}
        size="sm"
      ></wui-list-wallet>
    `}onAllWallets(){F.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),P.push("AllWallets",{redirectView:P.state.data?.redirectView})}};Le([d()],$e.prototype,"tabIdx",void 0);Le([T()],$e.prototype,"connectors",void 0);Le([T()],$e.prototype,"count",void 0);Le([T()],$e.prototype,"filteredCount",void 0);Le([T()],$e.prototype,"isFetchingRecommendedWallets",void 0);$e=Le([O("w3m-all-wallets-widget")],$e);const si=z`
  :host {
    margin-top: ${({spacing:e})=>e[1]};
  }
  wui-separator {
    margin: ${({spacing:e})=>e[3]} calc(${({spacing:e})=>e[3]} * -1)
      ${({spacing:e})=>e[2]} calc(${({spacing:e})=>e[3]} * -1);
    width: calc(100% + ${({spacing:e})=>e[3]} * 2);
  }
`;var fe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Z=class extends M{constructor(){super(),this.unsubscribe=[],this.connectors=K.state.connectors,this.recommended=N.state.recommended,this.featured=N.state.featured,this.explorerWallets=N.state.explorerWallets,this.connections=L.state.connections,this.connectorImages=Qt.state.connectorImages,this.loadingTelegram=!1,this.unsubscribe.push(K.subscribeKey("connectors",t=>this.connectors=t),L.subscribeKey("connections",t=>this.connections=t),Qt.subscribeKey("connectorImages",t=>this.connectorImages=t),N.subscribeKey("recommended",t=>this.recommended=t),N.subscribeKey("featured",t=>this.featured=t),N.subscribeKey("explorerFilteredWallets",t=>{this.explorerWallets=t?.length?t:N.state.explorerWallets}),N.subscribeKey("explorerWallets",t=>{this.explorerWallets?.length||(this.explorerWallets=t)})),B.isTelegram()&&B.isIos()&&(this.loadingTelegram=!L.state.wcUri,this.unsubscribe.push(L.subscribeKey("wcUri",t=>this.loadingTelegram=!t)))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){return u`
      <wui-flex flexDirection="column" gap="2"> ${this.connectorListTemplate()} </wui-flex>
    `}mapConnectorsToExplorerWallets(t,i){return t.map(r=>{if(r.type==="MULTI_CHAIN"&&r.connectors){const n=r.connectors.map(c=>c.id),s=r.connectors.map(c=>c.name),a=r.connectors.map(c=>c.info?.rdns),l=i?.find(c=>n.includes(c.id)||s.includes(c.name)||c.rdns&&(a.includes(c.rdns)||n.includes(c.rdns)));return r.explorerWallet=l??r.explorerWallet,r}const o=i?.find(n=>n.id===r.id||n.rdns===r.info?.rdns||n.name===r.name);return r.explorerWallet=o??r.explorerWallet,r})}processConnectorsByType(t,i=!0){const r=ve.sortConnectorsByExplorerWallet([...t]);return i?r.filter(ve.showConnector):r}connectorListTemplate(){const t=this.mapConnectorsToExplorerWallets(this.connectors,this.explorerWallets??[]),i=ve.getConnectorsByType(t,this.recommended,this.featured),r=this.processConnectorsByType(i.announced.filter(h=>h.id!=="walletConnect")),o=this.processConnectorsByType(i.injected),n=this.processConnectorsByType(i.multiChain.filter(h=>h.name!=="WalletConnect"),!1),s=i.custom,a=i.recent,l=this.processConnectorsByType(i.external.filter(h=>h.id!==Ge.CONNECTOR_ID.COINBASE_SDK)),c=i.recommended,f=i.featured,E=ve.getConnectorTypeOrder({custom:s,recent:a,announced:r,injected:o,multiChain:n,recommended:c,featured:f,external:l}),y=this.connectors.find(h=>h.id==="walletConnect"),p=B.isMobile(),v=[];for(const h of E)switch(h){case"walletConnect":{!p&&y&&v.push({kind:"connector",subtype:"walletConnect",connector:y});break}case"recent":{ve.getFilteredRecentWallets().forEach(g=>v.push({kind:"wallet",subtype:"recent",wallet:g}));break}case"injected":{n.forEach(w=>v.push({kind:"connector",subtype:"multiChain",connector:w})),r.forEach(w=>v.push({kind:"connector",subtype:"announced",connector:w})),o.forEach(w=>v.push({kind:"connector",subtype:"injected",connector:w}));break}case"featured":{f.forEach(w=>v.push({kind:"wallet",subtype:"featured",wallet:w}));break}case"custom":{ve.getFilteredCustomWallets(s??[]).forEach(g=>v.push({kind:"wallet",subtype:"custom",wallet:g}));break}case"external":{l.forEach(w=>v.push({kind:"connector",subtype:"external",connector:w}));break}case"recommended":{ve.getCappedRecommendedWallets(c).forEach(g=>v.push({kind:"wallet",subtype:"recommended",wallet:g}));break}default:console.warn(`Unknown connector type: ${h}`)}return v.map((h,w)=>h.kind==="connector"?this.renderConnector(h,w):this.renderWallet(h,w))}renderConnector(t,i){const r=t.connector,o=we.getConnectorImage(r)||this.connectorImages[r?.imageId??""],s=(this.connections.get(r.chain)??[]).some(E=>Zn.isLowerCaseMatch(E.connectorId,r.id));let a,l;t.subtype==="multiChain"?(a="multichain",l="info"):t.subtype==="walletConnect"?(a="qr code",l="accent"):t.subtype==="injected"||t.subtype==="announced"?(a=s?"connected":"installed",l=s?"info":"success"):(a=void 0,l=void 0);const c=L.hasAnyConnection(Ge.CONNECTOR_ID.WALLET_CONNECT),f=t.subtype==="walletConnect"||t.subtype==="external"?c:!1;return u`
      <w3m-list-wallet
        displayIndex=${i}
        imageSrc=${j(o)}
        .installed=${!0}
        name=${r.name??"Unknown"}
        .tagVariant=${l}
        tagLabel=${j(a)}
        data-testid=${`wallet-selector-${r.id.toLowerCase()}`}
        size="sm"
        @click=${()=>this.onClickConnector(t)}
        tabIdx=${j(this.tabIdx)}
        ?disabled=${f}
        rdnsId=${j(r.explorerWallet?.rdns||void 0)}
        walletRank=${j(r.explorerWallet?.order)}
      >
      </w3m-list-wallet>
    `}onClickConnector(t){const i=P.state.data?.redirectView;if(t.subtype==="walletConnect"){K.setActiveConnector(t.connector),B.isMobile()?P.push("AllWallets"):P.push("ConnectingWalletConnect",{redirectView:i});return}if(t.subtype==="multiChain"){K.setActiveConnector(t.connector),P.push("ConnectingMultiChain",{redirectView:i});return}if(t.subtype==="injected"){K.setActiveConnector(t.connector),P.push("ConnectingExternal",{connector:t.connector,redirectView:i,wallet:t.connector.explorerWallet});return}if(t.subtype==="announced"){if(t.connector.id==="walletConnect"){B.isMobile()?P.push("AllWallets"):P.push("ConnectingWalletConnect",{redirectView:i});return}P.push("ConnectingExternal",{connector:t.connector,redirectView:i,wallet:t.connector.explorerWallet});return}P.push("ConnectingExternal",{connector:t.connector,redirectView:i})}renderWallet(t,i){const r=t.wallet,o=we.getWalletImage(r),s=L.hasAnyConnection(Ge.CONNECTOR_ID.WALLET_CONNECT),a=this.loadingTelegram,l=t.subtype==="recent"?"recent":void 0,c=t.subtype==="recent"?"info":void 0;return u`
      <w3m-list-wallet
        displayIndex=${i}
        imageSrc=${j(o)}
        name=${r.name??"Unknown"}
        @click=${()=>this.onClickWallet(t)}
        size="sm"
        data-testid=${`wallet-selector-${r.id}`}
        tabIdx=${j(this.tabIdx)}
        ?loading=${a}
        ?disabled=${s}
        rdnsId=${j(r.rdns||void 0)}
        walletRank=${j(r.order)}
        tagLabel=${j(l)}
        .tagVariant=${c}
      >
      </w3m-list-wallet>
    `}onClickWallet(t){const i=P.state.data?.redirectView;if(t.subtype==="featured"){K.selectWalletConnector(t.wallet);return}if(t.subtype==="recent"){if(this.loadingTelegram)return;K.selectWalletConnector(t.wallet);return}if(t.subtype==="custom"){if(this.loadingTelegram)return;P.push("ConnectingWalletConnect",{wallet:t.wallet,redirectView:i});return}if(this.loadingTelegram)return;const r=K.getConnector({id:t.wallet.id,rdns:t.wallet.rdns});r?P.push("ConnectingExternal",{connector:r,redirectView:i}):P.push("ConnectingWalletConnect",{wallet:t.wallet,redirectView:i})}};Z.styles=si;fe([d({type:Number})],Z.prototype,"tabIdx",void 0);fe([T()],Z.prototype,"connectors",void 0);fe([T()],Z.prototype,"recommended",void 0);fe([T()],Z.prototype,"featured",void 0);fe([T()],Z.prototype,"explorerWallets",void 0);fe([T()],Z.prototype,"connections",void 0);fe([T()],Z.prototype,"connectorImages",void 0);fe([T()],Z.prototype,"loadingTelegram",void 0);Z=fe([O("w3m-connector-list")],Z);const ai=z`
  :host {
    flex: 1;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: ${({spacing:e})=>e[1]} ${({spacing:e})=>e[2]};
    column-gap: ${({spacing:e})=>e[1]};
    color: ${({tokens:e})=>e.theme.textSecondary};
    border-radius: ${({borderRadius:e})=>e[20]};
    background-color: transparent;
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-active='true'] {
    color: ${({tokens:e})=>e.theme.textPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
  }

  button:hover:enabled:not([data-active='true']),
  button:active:enabled:not([data-active='true']) {
    wui-text,
    wui-icon {
      color: ${({tokens:e})=>e.theme.textPrimary};
    }
  }
`;var Ue=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};const li={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},ci={lg:"md",md:"sm",sm:"sm"};let Ce=class extends M{constructor(){super(...arguments),this.icon="mobile",this.size="md",this.label="",this.active=!1}render(){return u`
      <button data-active=${this.active}>
        ${this.icon?u`<wui-icon size=${ci[this.size]} name=${this.icon}></wui-icon>`:""}
        <wui-text variant=${li[this.size]}> ${this.label} </wui-text>
      </button>
    `}};Ce.styles=[G,he,ai];Ue([d()],Ce.prototype,"icon",void 0);Ue([d()],Ce.prototype,"size",void 0);Ue([d()],Ce.prototype,"label",void 0);Ue([d({type:Boolean})],Ce.prototype,"active",void 0);Ce=Ue([O("wui-tab-item")],Ce);const ui=z`
  :host {
    display: inline-flex;
    align-items: center;
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    border-radius: ${({borderRadius:e})=>e[32]};
    padding: ${({spacing:e})=>e["01"]};
    box-sizing: border-box;
  }

  :host([data-size='sm']) {
    height: 26px;
  }

  :host([data-size='md']) {
    height: 36px;
  }
`;var qe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let xe=class extends M{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.size="md",this.activeTab=0}render(){return this.dataset.size=this.size,this.tabs.map((t,i)=>{const r=i===this.activeTab;return u`
        <wui-tab-item
          @click=${()=>this.onTabClick(i)}
          icon=${t.icon}
          size=${this.size}
          label=${t.label}
          ?active=${r}
          data-active=${r}
          data-testid="tab-${t.label?.toLowerCase()}"
        ></wui-tab-item>
      `})}onTabClick(t){this.activeTab=t,this.onTabChange(t)}};xe.styles=[G,he,ui];qe([d({type:Array})],xe.prototype,"tabs",void 0);qe([d()],xe.prototype,"onTabChange",void 0);qe([d()],xe.prototype,"size",void 0);qe([T()],xe.prototype,"activeTab",void 0);xe=qe([O("wui-tabs")],xe);var jt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Qe=class extends M{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(t=>t())}render(){const t=this.generateTabs();return u`
      <wui-flex justifyContent="center" .padding=${["0","0","4","0"]}>
        <wui-tabs .tabs=${t} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){const t=this.platforms.map(i=>i==="browser"?{label:"Browser",icon:"extension",platform:"browser"}:i==="mobile"?{label:"Mobile",icon:"mobile",platform:"mobile"}:i==="qrcode"?{label:"Mobile",icon:"mobile",platform:"qrcode"}:i==="web"?{label:"Webapp",icon:"browser",platform:"web"}:i==="desktop"?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=t.map(({platform:i})=>i),t}onTabChange(t){const i=this.platformTabs[t];i&&this.onSelectPlatfrom?.(i)}};jt([d({type:Array})],Qe.prototype,"platforms",void 0);jt([d()],Qe.prototype,"onSelectPlatfrom",void 0);Qe=jt([O("w3m-connecting-header")],Qe);const di=z`
  :host {
    width: var(--local-width);
  }

  button {
    width: var(--local-width);
    white-space: nowrap;
    column-gap: ${({spacing:e})=>e[2]};
    transition:
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: scale, background-color, border-radius;
    cursor: pointer;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='sm'] {
    border-radius: ${({borderRadius:e})=>e[2]};
    padding: 0 ${({spacing:e})=>e[2]};
    height: 28px;
  }

  button[data-size='md'] {
    border-radius: ${({borderRadius:e})=>e[3]};
    padding: 0 ${({spacing:e})=>e[4]};
    height: 38px;
  }

  button[data-size='lg'] {
    border-radius: ${({borderRadius:e})=>e[4]};
    padding: 0 ${({spacing:e})=>e[5]};
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='accent-primary'] {
    background-color: ${({tokens:e})=>e.core.backgroundAccentPrimary};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='accent-secondary'] {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button[data-variant='neutral-primary'] {
    background-color: ${({tokens:e})=>e.theme.backgroundInvert};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='neutral-secondary'] {
    background-color: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='neutral-tertiary'] {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='error-primary'] {
    background-color: ${({tokens:e})=>e.core.textError};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='error-secondary'] {
    background-color: ${({tokens:e})=>e.core.backgroundError};
    color: ${({tokens:e})=>e.core.textError};
  }

  button[data-variant='shade'] {
    background: var(--wui-color-gray-glass-002);
    color: var(--wui-color-fg-200);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-size='sm']:focus-visible:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:focus-visible:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:focus-visible:enabled {
    border-radius: 48px;
  }
  button[data-variant='shade']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button[data-size='sm']:hover:enabled {
      border-radius: 28px;
    }

    button[data-size='md']:hover:enabled {
      border-radius: 38px;
    }

    button[data-size='lg']:hover:enabled {
      border-radius: 48px;
    }

    button[data-variant='shade']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='shade']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }
  }

  button[data-size='sm']:active:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:active:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:active:enabled {
    border-radius: 48px;
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    opacity: 0.3;
  }
`;var Se=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};const hi={lg:"lg-regular-mono",md:"md-regular-mono",sm:"sm-regular-mono"},fi={lg:"md",md:"md",sm:"sm"};let ue=class extends M{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="accent-primary"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
     `;const t=this.textVariant??hi[this.size];return u`
      <button data-variant=${this.variant} data-size=${this.size} ?disabled=${this.disabled}>
        ${this.loadingTemplate()}
        <slot name="iconLeft"></slot>
        <wui-text variant=${t} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}loadingTemplate(){if(this.loading){const t=fi[this.size],i=this.variant==="neutral-primary"||this.variant==="accent-primary"?"invert":"primary";return u`<wui-loading-spinner color=${i} size=${t}></wui-loading-spinner>`}return null}};ue.styles=[G,he,di];Se([d()],ue.prototype,"size",void 0);Se([d({type:Boolean})],ue.prototype,"disabled",void 0);Se([d({type:Boolean})],ue.prototype,"fullWidth",void 0);Se([d({type:Boolean})],ue.prototype,"loading",void 0);Se([d()],ue.prototype,"variant",void 0);Se([d()],ue.prototype,"textVariant",void 0);ue=Se([O("wui-button")],ue);const pi=z`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${e=>e.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var Dn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Ye=class extends M{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){const t=this.radius>50?50:this.radius,r=36-t,o=116+r,n=245+r,s=360+r*1.75;return u`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${t}
          stroke-dasharray="${o} ${n}"
          stroke-dashoffset=${s}
        />
      </svg>
    `}};Ye.styles=[G,pi];Dn([d({type:Number})],Ye.prototype,"radius",void 0);Ye=Dn([O("wui-loading-thumbnail")],Ye);const gi=z`
  wui-flex {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    padding-left: ${({spacing:e})=>e[3]};
    padding-right: ${({spacing:e})=>e[3]};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:e})=>e[6]};
  }

  wui-text {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  wui-icon {
    width: 12px;
    height: 12px;
  }
`;var ot=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Pe=class extends M{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return u`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="inherit">${this.label}</wui-text>
        <wui-button variant="accent-secondary" size="sm">
          ${this.buttonLabel}
          <wui-icon name="chevronRight" color="inherit" size="inherit" slot="iconRight"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};Pe.styles=[G,he,gi];ot([d({type:Boolean})],Pe.prototype,"disabled",void 0);ot([d()],Pe.prototype,"label",void 0);ot([d()],Pe.prototype,"buttonLabel",void 0);Pe=ot([O("wui-cta-button")],Pe);const mi=z`
  :host {
    display: block;
    padding: 0 ${({spacing:e})=>e[5]} ${({spacing:e})=>e[5]};
  }
`;var Mn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Je=class extends M{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;const{name:t,app_store:i,play_store:r,chrome_store:o,homepage:n}=this.wallet,s=B.isMobile(),a=B.isIos(),l=B.isAndroid(),c=[i,r,n,o].filter(Boolean).length>1,f=ce.getTruncateString({string:t,charsStart:12,charsEnd:0,truncate:"end"});return c&&!s?u`
        <wui-cta-button
          label=${`Don't have ${f}?`}
          buttonLabel="Get"
          @click=${()=>P.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!c&&n?u`
        <wui-cta-button
          label=${`Don't have ${f}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:i&&a?u`
        <wui-cta-button
          label=${`Don't have ${f}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:r&&l?u`
        <wui-cta-button
          label=${`Don't have ${f}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){this.wallet?.app_store&&B.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&B.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&B.openHref(this.wallet.homepage,"_blank")}};Je.styles=[mi];Mn([d({type:Object})],Je.prototype,"wallet",void 0);Je=Mn([O("w3m-mobile-download-links")],Je);const wi=z`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-wallet-image {
    width: 56px;
    height: 56px;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:e})=>e[1]} * -1);
    bottom: calc(${({spacing:e})=>e[1]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: ${({durations:e})=>e.lg};
    transition-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:e})=>e[4]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:e})=>e["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  w3m-mobile-download-links {
    padding: 0px;
    width: 100%;
  }
`;var ee=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};class U extends M{constructor(){super(),this.wallet=P.state.data?.wallet,this.connector=P.state.data?.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=we.getConnectorImage(this.connector)??we.getWalletImage(this.wallet),this.name=this.wallet?.name??this.connector?.name??"Wallet",this.isRetrying=!1,this.uri=L.state.wcUri,this.error=L.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(L.subscribeKey("wcUri",t=>{this.uri=t,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,this.onConnect?.())}),L.subscribeKey("wcError",t=>this.error=t)),(B.isTelegram()||B.isSafari())&&B.isIos()&&L.state.wcUri&&this.onConnect?.()}firstUpdated(){this.onAutoConnect?.(),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(t=>t()),L.setWcError(!1),clearTimeout(this.timeout)}render(){this.onRender?.(),this.onShowRetry();const t=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel;let i="";return this.label?i=this.label:(i=`Continue in ${this.name}`,this.error&&(i="Connection declined")),u`
      <wui-flex
        data-error=${j(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex gap="2" justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${j(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="6"> <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","0","0"]}
        >
          <wui-text align="center" variant="lg-medium" color=${this.error?"error":"primary"}>
            ${i}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">${t}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?u`
                <wui-button
                  variant="neutral-secondary"
                  size="md"
                  ?disabled=${this.isRetrying||this.isLoading}
                  @click=${this.onTryAgain.bind(this)}
                  data-testid="w3m-connecting-widget-secondary-button"
                >
                  <wui-icon
                    color="inherit"
                    slot="iconLeft"
                    name=${this.secondaryBtnIcon}
                  ></wui-icon>
                  ${this.secondaryBtnLabel}
                </wui-button>
              `:null}
      </wui-flex>

      ${this.isWalletConnect?u`
              <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
                <wui-link
                  @click=${this.onCopyUri}
                  variant="secondary"
                  icon="copy"
                  data-testid="wui-link-copy"
                >
                  Copy link
                </wui-link>
              </wui-flex>
            `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links></wui-flex>
      </wui-flex>
    `}onShowRetry(){this.error&&!this.showRetry&&(this.showRetry=!0,this.shadowRoot?.querySelector("wui-button")?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"}))}onTryAgain(){L.setWcError(!1),this.onRetry?(this.isRetrying=!0,this.onRetry?.()):this.onConnect?.()}loaderTemplate(){const t=Ot.state.themeVariables["--w3m-border-radius-master"],i=t?parseInt(t.replace("px",""),10):4;return u`<wui-loading-thumbnail radius=${i*9}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(B.copyToClopboard(this.uri),ze.showSuccess("Link copied"))}catch{ze.showError("Failed to copy")}}}U.styles=wi;ee([T()],U.prototype,"isRetrying",void 0);ee([T()],U.prototype,"uri",void 0);ee([T()],U.prototype,"error",void 0);ee([T()],U.prototype,"ready",void 0);ee([T()],U.prototype,"showRetry",void 0);ee([T()],U.prototype,"label",void 0);ee([T()],U.prototype,"secondaryBtnLabel",void 0);ee([T()],U.prototype,"secondaryLabel",void 0);ee([T()],U.prototype,"isLoading",void 0);ee([d({type:Boolean})],U.prototype,"isMobile",void 0);ee([d()],U.prototype,"onRetry",void 0);var bi=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Jt=class extends U{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),F.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:P.state.view}})}async onConnectProxy(){try{this.error=!1;const{connectors:t}=K.state,i=t.find(r=>r.type==="ANNOUNCED"&&r.info?.rdns===this.wallet?.rdns||r.type==="INJECTED"||r.name===this.wallet?.name);if(i)await L.connectExternal(i,i.chain);else throw new Error("w3m-connecting-wc-browser: No connector found");Pn.close(),F.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.wallet?.name||"Unknown",view:P.state.view,walletRank:this.wallet?.order}})}catch(t){t instanceof Bn&&t.originalName===Ln.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?F.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:t.message}}):F.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:t?.message??"Unknown"}}),this.error=!0}}};Jt=bi([O("w3m-connecting-wc-browser")],Jt);var yi=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Xt=class extends U{constructor(){if(super(),!this.wallet)throw new Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),F.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:P.state.view}})}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onConnectProxy(){if(this.wallet?.desktop_link&&this.uri)try{this.error=!1;const{desktop_link:t,name:i}=this.wallet,{redirect:r,href:o}=B.formatNativeUrl(t,this.uri);L.setWcLinking({name:i,href:o}),L.setRecentWallet(this.wallet),B.openHref(r,"_blank")}catch{this.error=!0}}};Xt=yi([O("w3m-connecting-wc-desktop")],Xt);var Ne=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Ee=class extends U{constructor(){if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=q.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{if(this.wallet?.mobile_link&&this.uri)try{this.error=!1;const{mobile_link:t,link_mode:i,name:r}=this.wallet,{redirect:o,redirectUniversalLink:n,href:s}=B.formatNativeUrl(t,this.uri,i);this.redirectDeeplink=o,this.redirectUniversalLink=n,this.target=B.isIframe()?"_top":"_self",L.setWcLinking({name:r,href:s}),L.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?B.openHref(this.redirectUniversalLink,this.target):B.openHref(this.redirectDeeplink,this.target)}catch(t){F.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:t instanceof Error?t.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw new Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=Nn.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(L.subscribeKey("wcUri",()=>{this.onHandleURI()})),F.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:P.state.view}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onTryAgain(){L.setWcError(!1),this.onConnect?.()}};Ne([T()],Ee.prototype,"redirectDeeplink",void 0);Ne([T()],Ee.prototype,"redirectUniversalLink",void 0);Ne([T()],Ee.prototype,"target",void 0);Ne([T()],Ee.prototype,"preferUniversalLinks",void 0);Ne([T()],Ee.prototype,"isLoading",void 0);Ee=Ne([O("w3m-connecting-wc-mobile")],Ee);var Ae={},dt,Zt;function vi(){return Zt||(Zt=1,dt=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),dt}var ht={},me={},en;function Te(){if(en)return me;en=1;let e;const t=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return me.getSymbolSize=function(r){if(!r)throw new Error('"version" cannot be null or undefined');if(r<1||r>40)throw new Error('"version" should be in range from 1 to 40');return r*4+17},me.getSymbolTotalCodewords=function(r){return t[r]},me.getBCHDigit=function(i){let r=0;for(;i!==0;)r++,i>>>=1;return r},me.setToSJISFunction=function(r){if(typeof r!="function")throw new Error('"toSJISFunc" is not a valid function.');e=r},me.isKanjiModeEnabled=function(){return typeof e<"u"},me.toSJIS=function(r){return e(r)},me}var ft={},tn;function zt(){return tn||(tn=1,(function(e){e.L={bit:1},e.M={bit:0},e.Q={bit:3},e.H={bit:2};function t(i){if(typeof i!="string")throw new Error("Param is not a string");switch(i.toLowerCase()){case"l":case"low":return e.L;case"m":case"medium":return e.M;case"q":case"quartile":return e.Q;case"h":case"high":return e.H;default:throw new Error("Unknown EC Level: "+i)}}e.isValid=function(r){return r&&typeof r.bit<"u"&&r.bit>=0&&r.bit<4},e.from=function(r,o){if(e.isValid(r))return r;try{return t(r)}catch{return o}}})(ft)),ft}var pt,nn;function $i(){if(nn)return pt;nn=1;function e(){this.buffer=[],this.length=0}return e.prototype={get:function(t){const i=Math.floor(t/8);return(this.buffer[i]>>>7-t%8&1)===1},put:function(t,i){for(let r=0;r<i;r++)this.putBit((t>>>i-r-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(t){const i=Math.floor(this.length/8);this.buffer.length<=i&&this.buffer.push(0),t&&(this.buffer[i]|=128>>>this.length%8),this.length++}},pt=e,pt}var gt,rn;function Ci(){if(rn)return gt;rn=1;function e(t){if(!t||t<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=t,this.data=new Uint8Array(t*t),this.reservedBit=new Uint8Array(t*t)}return e.prototype.set=function(t,i,r,o){const n=t*this.size+i;this.data[n]=r,o&&(this.reservedBit[n]=!0)},e.prototype.get=function(t,i){return this.data[t*this.size+i]},e.prototype.xor=function(t,i,r){this.data[t*this.size+i]^=r},e.prototype.isReserved=function(t,i){return this.reservedBit[t*this.size+i]},gt=e,gt}var mt={},on;function xi(){return on||(on=1,(function(e){const t=Te().getSymbolSize;e.getRowColCoords=function(r){if(r===1)return[];const o=Math.floor(r/7)+2,n=t(r),s=n===145?26:Math.ceil((n-13)/(2*o-2))*2,a=[n-7];for(let l=1;l<o-1;l++)a[l]=a[l-1]-s;return a.push(6),a.reverse()},e.getPositions=function(r){const o=[],n=e.getRowColCoords(r),s=n.length;for(let a=0;a<s;a++)for(let l=0;l<s;l++)a===0&&l===0||a===0&&l===s-1||a===s-1&&l===0||o.push([n[a],n[l]]);return o}})(mt)),mt}var wt={},sn;function Ei(){if(sn)return wt;sn=1;const e=Te().getSymbolSize,t=7;return wt.getPositions=function(r){const o=e(r);return[[0,0],[o-t,0],[0,o-t]]},wt}var bt={},an;function Ri(){return an||(an=1,(function(e){e.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const t={N1:3,N2:3,N3:40,N4:10};e.isValid=function(o){return o!=null&&o!==""&&!isNaN(o)&&o>=0&&o<=7},e.from=function(o){return e.isValid(o)?parseInt(o,10):void 0},e.getPenaltyN1=function(o){const n=o.size;let s=0,a=0,l=0,c=null,f=null;for(let E=0;E<n;E++){a=l=0,c=f=null;for(let y=0;y<n;y++){let p=o.get(E,y);p===c?a++:(a>=5&&(s+=t.N1+(a-5)),c=p,a=1),p=o.get(y,E),p===f?l++:(l>=5&&(s+=t.N1+(l-5)),f=p,l=1)}a>=5&&(s+=t.N1+(a-5)),l>=5&&(s+=t.N1+(l-5))}return s},e.getPenaltyN2=function(o){const n=o.size;let s=0;for(let a=0;a<n-1;a++)for(let l=0;l<n-1;l++){const c=o.get(a,l)+o.get(a,l+1)+o.get(a+1,l)+o.get(a+1,l+1);(c===4||c===0)&&s++}return s*t.N2},e.getPenaltyN3=function(o){const n=o.size;let s=0,a=0,l=0;for(let c=0;c<n;c++){a=l=0;for(let f=0;f<n;f++)a=a<<1&2047|o.get(c,f),f>=10&&(a===1488||a===93)&&s++,l=l<<1&2047|o.get(f,c),f>=10&&(l===1488||l===93)&&s++}return s*t.N3},e.getPenaltyN4=function(o){let n=0;const s=o.data.length;for(let l=0;l<s;l++)n+=o.data[l];return Math.abs(Math.ceil(n*100/s/5)-10)*t.N4};function i(r,o,n){switch(r){case e.Patterns.PATTERN000:return(o+n)%2===0;case e.Patterns.PATTERN001:return o%2===0;case e.Patterns.PATTERN010:return n%3===0;case e.Patterns.PATTERN011:return(o+n)%3===0;case e.Patterns.PATTERN100:return(Math.floor(o/2)+Math.floor(n/3))%2===0;case e.Patterns.PATTERN101:return o*n%2+o*n%3===0;case e.Patterns.PATTERN110:return(o*n%2+o*n%3)%2===0;case e.Patterns.PATTERN111:return(o*n%3+(o+n)%2)%2===0;default:throw new Error("bad maskPattern:"+r)}}e.applyMask=function(o,n){const s=n.size;for(let a=0;a<s;a++)for(let l=0;l<s;l++)n.isReserved(l,a)||n.xor(l,a,i(o,l,a))},e.getBestMask=function(o,n){const s=Object.keys(e.Patterns).length;let a=0,l=1/0;for(let c=0;c<s;c++){n(c),e.applyMask(c,o);const f=e.getPenaltyN1(o)+e.getPenaltyN2(o)+e.getPenaltyN3(o)+e.getPenaltyN4(o);e.applyMask(c,o),f<l&&(l=f,a=c)}return a}})(bt)),bt}var Ke={},ln;function jn(){if(ln)return Ke;ln=1;const e=zt(),t=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],i=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return Ke.getBlocksCount=function(o,n){switch(n){case e.L:return t[(o-1)*4+0];case e.M:return t[(o-1)*4+1];case e.Q:return t[(o-1)*4+2];case e.H:return t[(o-1)*4+3];default:return}},Ke.getTotalCodewordsCount=function(o,n){switch(n){case e.L:return i[(o-1)*4+0];case e.M:return i[(o-1)*4+1];case e.Q:return i[(o-1)*4+2];case e.H:return i[(o-1)*4+3];default:return}},Ke}var yt={},De={},cn;function _i(){if(cn)return De;cn=1;const e=new Uint8Array(512),t=new Uint8Array(256);return(function(){let r=1;for(let o=0;o<255;o++)e[o]=r,t[r]=o,r<<=1,r&256&&(r^=285);for(let o=255;o<512;o++)e[o]=e[o-255]})(),De.log=function(r){if(r<1)throw new Error("log("+r+")");return t[r]},De.exp=function(r){return e[r]},De.mul=function(r,o){return r===0||o===0?0:e[t[r]+t[o]]},De}var un;function Si(){return un||(un=1,(function(e){const t=_i();e.mul=function(r,o){const n=new Uint8Array(r.length+o.length-1);for(let s=0;s<r.length;s++)for(let a=0;a<o.length;a++)n[s+a]^=t.mul(r[s],o[a]);return n},e.mod=function(r,o){let n=new Uint8Array(r);for(;n.length-o.length>=0;){const s=n[0];for(let l=0;l<o.length;l++)n[l]^=t.mul(o[l],s);let a=0;for(;a<n.length&&n[a]===0;)a++;n=n.slice(a)}return n},e.generateECPolynomial=function(r){let o=new Uint8Array([1]);for(let n=0;n<r;n++)o=e.mul(o,new Uint8Array([1,t.exp(n)]));return o}})(yt)),yt}var vt,dn;function Ti(){if(dn)return vt;dn=1;const e=Si();function t(i){this.genPoly=void 0,this.degree=i,this.degree&&this.initialize(this.degree)}return t.prototype.initialize=function(r){this.degree=r,this.genPoly=e.generateECPolynomial(this.degree)},t.prototype.encode=function(r){if(!this.genPoly)throw new Error("Encoder not initialized");const o=new Uint8Array(r.length+this.degree);o.set(r);const n=e.mod(o,this.genPoly),s=this.degree-n.length;if(s>0){const a=new Uint8Array(this.degree);return a.set(n,s),a}return n},vt=t,vt}var $t={},Ct={},xt={},hn;function zn(){return hn||(hn=1,xt.isValid=function(t){return!isNaN(t)&&t>=1&&t<=40}),xt}var te={},fn;function Un(){if(fn)return te;fn=1;const e="[0-9]+",t="[A-Z $%*+\\-./:]+";let i="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";i=i.replace(/u/g,"\\u");const r="(?:(?![A-Z0-9 $%*+\\-./:]|"+i+`)(?:.|[\r
]))+`;te.KANJI=new RegExp(i,"g"),te.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),te.BYTE=new RegExp(r,"g"),te.NUMERIC=new RegExp(e,"g"),te.ALPHANUMERIC=new RegExp(t,"g");const o=new RegExp("^"+i+"$"),n=new RegExp("^"+e+"$"),s=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return te.testKanji=function(l){return o.test(l)},te.testNumeric=function(l){return n.test(l)},te.testAlphanumeric=function(l){return s.test(l)},te}var pn;function Ie(){return pn||(pn=1,(function(e){const t=zn(),i=Un();e.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},e.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},e.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},e.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},e.MIXED={bit:-1},e.getCharCountIndicator=function(n,s){if(!n.ccBits)throw new Error("Invalid mode: "+n);if(!t.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?n.ccBits[0]:s<27?n.ccBits[1]:n.ccBits[2]},e.getBestModeForData=function(n){return i.testNumeric(n)?e.NUMERIC:i.testAlphanumeric(n)?e.ALPHANUMERIC:i.testKanji(n)?e.KANJI:e.BYTE},e.toString=function(n){if(n&&n.id)return n.id;throw new Error("Invalid mode")},e.isValid=function(n){return n&&n.bit&&n.ccBits};function r(o){if(typeof o!="string")throw new Error("Param is not a string");switch(o.toLowerCase()){case"numeric":return e.NUMERIC;case"alphanumeric":return e.ALPHANUMERIC;case"kanji":return e.KANJI;case"byte":return e.BYTE;default:throw new Error("Unknown mode: "+o)}}e.from=function(n,s){if(e.isValid(n))return n;try{return r(n)}catch{return s}}})(Ct)),Ct}var gn;function Ii(){return gn||(gn=1,(function(e){const t=Te(),i=jn(),r=zt(),o=Ie(),n=zn(),s=7973,a=t.getBCHDigit(s);function l(y,p,v){for(let h=1;h<=40;h++)if(p<=e.getCapacity(h,v,y))return h}function c(y,p){return o.getCharCountIndicator(y,p)+4}function f(y,p){let v=0;return y.forEach(function(h){const w=c(h.mode,p);v+=w+h.getBitsLength()}),v}function E(y,p){for(let v=1;v<=40;v++)if(f(y,v)<=e.getCapacity(v,p,o.MIXED))return v}e.from=function(p,v){return n.isValid(p)?parseInt(p,10):v},e.getCapacity=function(p,v,h){if(!n.isValid(p))throw new Error("Invalid QR Code version");typeof h>"u"&&(h=o.BYTE);const w=t.getSymbolTotalCodewords(p),g=i.getTotalCodewordsCount(p,v),b=(w-g)*8;if(h===o.MIXED)return b;const $=b-c(h,p);switch(h){case o.NUMERIC:return Math.floor($/10*3);case o.ALPHANUMERIC:return Math.floor($/11*2);case o.KANJI:return Math.floor($/13);case o.BYTE:default:return Math.floor($/8)}},e.getBestVersionForData=function(p,v){let h;const w=r.from(v,r.M);if(Array.isArray(p)){if(p.length>1)return E(p,w);if(p.length===0)return 1;h=p[0]}else h=p;return l(h.mode,h.getLength(),w)},e.getEncodedBits=function(p){if(!n.isValid(p)||p<7)throw new Error("Invalid QR Code version");let v=p<<12;for(;t.getBCHDigit(v)-a>=0;)v^=s<<t.getBCHDigit(v)-a;return p<<12|v}})($t)),$t}var Et={},mn;function ki(){if(mn)return Et;mn=1;const e=Te(),t=1335,i=21522,r=e.getBCHDigit(t);return Et.getEncodedBits=function(n,s){const a=n.bit<<3|s;let l=a<<10;for(;e.getBCHDigit(l)-r>=0;)l^=t<<e.getBCHDigit(l)-r;return(a<<10|l)^i},Et}var Rt={},_t,wn;function Wi(){if(wn)return _t;wn=1;const e=Ie();function t(i){this.mode=e.NUMERIC,this.data=i.toString()}return t.getBitsLength=function(r){return 10*Math.floor(r/3)+(r%3?r%3*3+1:0)},t.prototype.getLength=function(){return this.data.length},t.prototype.getBitsLength=function(){return t.getBitsLength(this.data.length)},t.prototype.write=function(r){let o,n,s;for(o=0;o+3<=this.data.length;o+=3)n=this.data.substr(o,3),s=parseInt(n,10),r.put(s,10);const a=this.data.length-o;a>0&&(n=this.data.substr(o),s=parseInt(n,10),r.put(s,a*3+1))},_t=t,_t}var St,bn;function Ai(){if(bn)return St;bn=1;const e=Ie(),t=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function i(r){this.mode=e.ALPHANUMERIC,this.data=r}return i.getBitsLength=function(o){return 11*Math.floor(o/2)+6*(o%2)},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(o){let n;for(n=0;n+2<=this.data.length;n+=2){let s=t.indexOf(this.data[n])*45;s+=t.indexOf(this.data[n+1]),o.put(s,11)}this.data.length%2&&o.put(t.indexOf(this.data[n]),6)},St=i,St}var Tt,yn;function Pi(){return yn||(yn=1,Tt=function(t){for(var i=[],r=t.length,o=0;o<r;o++){var n=t.charCodeAt(o);if(n>=55296&&n<=56319&&r>o+1){var s=t.charCodeAt(o+1);s>=56320&&s<=57343&&(n=(n-55296)*1024+s-56320+65536,o+=1)}if(n<128){i.push(n);continue}if(n<2048){i.push(n>>6|192),i.push(n&63|128);continue}if(n<55296||n>=57344&&n<65536){i.push(n>>12|224),i.push(n>>6&63|128),i.push(n&63|128);continue}if(n>=65536&&n<=1114111){i.push(n>>18|240),i.push(n>>12&63|128),i.push(n>>6&63|128),i.push(n&63|128);continue}i.push(239,191,189)}return new Uint8Array(i).buffer}),Tt}var It,vn;function Bi(){if(vn)return It;vn=1;const e=Pi(),t=Ie();function i(r){this.mode=t.BYTE,typeof r=="string"&&(r=e(r)),this.data=new Uint8Array(r)}return i.getBitsLength=function(o){return o*8},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(r){for(let o=0,n=this.data.length;o<n;o++)r.put(this.data[o],8)},It=i,It}var kt,$n;function Li(){if($n)return kt;$n=1;const e=Ie(),t=Te();function i(r){this.mode=e.KANJI,this.data=r}return i.getBitsLength=function(o){return o*13},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(r){let o;for(o=0;o<this.data.length;o++){let n=t.toSJIS(this.data[o]);if(n>=33088&&n<=40956)n-=33088;else if(n>=57408&&n<=60351)n-=49472;else throw new Error("Invalid SJIS character: "+this.data[o]+`
Make sure your charset is UTF-8`);n=(n>>>8&255)*192+(n&255),r.put(n,13)}},kt=i,kt}var Wt={exports:{}},Cn;function Ni(){return Cn||(Cn=1,(function(e){var t={single_source_shortest_paths:function(i,r,o){var n={},s={};s[r]=0;var a=t.PriorityQueue.make();a.push(r,0);for(var l,c,f,E,y,p,v,h,w;!a.empty();){l=a.pop(),c=l.value,E=l.cost,y=i[c]||{};for(f in y)y.hasOwnProperty(f)&&(p=y[f],v=E+p,h=s[f],w=typeof s[f]>"u",(w||h>v)&&(s[f]=v,a.push(f,v),n[f]=c))}if(typeof o<"u"&&typeof s[o]>"u"){var g=["Could not find a path from ",r," to ",o,"."].join("");throw new Error(g)}return n},extract_shortest_path_from_predecessor_list:function(i,r){for(var o=[],n=r;n;)o.push(n),i[n],n=i[n];return o.reverse(),o},find_path:function(i,r,o){var n=t.single_source_shortest_paths(i,r,o);return t.extract_shortest_path_from_predecessor_list(n,o)},PriorityQueue:{make:function(i){var r=t.PriorityQueue,o={},n;i=i||{};for(n in r)r.hasOwnProperty(n)&&(o[n]=r[n]);return o.queue=[],o.sorter=i.sorter||r.default_sorter,o},default_sorter:function(i,r){return i.cost-r.cost},push:function(i,r){var o={value:i,cost:r};this.queue.push(o),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};e.exports=t})(Wt)),Wt.exports}var xn;function Oi(){return xn||(xn=1,(function(e){const t=Ie(),i=Wi(),r=Ai(),o=Bi(),n=Li(),s=Un(),a=Te(),l=Ni();function c(g){return unescape(encodeURIComponent(g)).length}function f(g,b,$){const m=[];let D;for(;(D=g.exec($))!==null;)m.push({data:D[0],index:D.index,mode:b,length:D[0].length});return m}function E(g){const b=f(s.NUMERIC,t.NUMERIC,g),$=f(s.ALPHANUMERIC,t.ALPHANUMERIC,g);let m,D;return a.isKanjiModeEnabled()?(m=f(s.BYTE,t.BYTE,g),D=f(s.KANJI,t.KANJI,g)):(m=f(s.BYTE_KANJI,t.BYTE,g),D=[]),b.concat($,m,D).sort(function(I,S){return I.index-S.index}).map(function(I){return{data:I.data,mode:I.mode,length:I.length}})}function y(g,b){switch(b){case t.NUMERIC:return i.getBitsLength(g);case t.ALPHANUMERIC:return r.getBitsLength(g);case t.KANJI:return n.getBitsLength(g);case t.BYTE:return o.getBitsLength(g)}}function p(g){return g.reduce(function(b,$){const m=b.length-1>=0?b[b.length-1]:null;return m&&m.mode===$.mode?(b[b.length-1].data+=$.data,b):(b.push($),b)},[])}function v(g){const b=[];for(let $=0;$<g.length;$++){const m=g[$];switch(m.mode){case t.NUMERIC:b.push([m,{data:m.data,mode:t.ALPHANUMERIC,length:m.length},{data:m.data,mode:t.BYTE,length:m.length}]);break;case t.ALPHANUMERIC:b.push([m,{data:m.data,mode:t.BYTE,length:m.length}]);break;case t.KANJI:b.push([m,{data:m.data,mode:t.BYTE,length:c(m.data)}]);break;case t.BYTE:b.push([{data:m.data,mode:t.BYTE,length:c(m.data)}])}}return b}function h(g,b){const $={},m={start:{}};let D=["start"];for(let x=0;x<g.length;x++){const I=g[x],S=[];for(let C=0;C<I.length;C++){const W=I[C],R=""+x+C;S.push(R),$[R]={node:W,lastCount:0},m[R]={};for(let k=0;k<D.length;k++){const _=D[k];$[_]&&$[_].node.mode===W.mode?(m[_][R]=y($[_].lastCount+W.length,W.mode)-y($[_].lastCount,W.mode),$[_].lastCount+=W.length):($[_]&&($[_].lastCount=W.length),m[_][R]=y(W.length,W.mode)+4+t.getCharCountIndicator(W.mode,b))}}D=S}for(let x=0;x<D.length;x++)m[D[x]].end=0;return{map:m,table:$}}function w(g,b){let $;const m=t.getBestModeForData(g);if($=t.from(b,m),$!==t.BYTE&&$.bit<m.bit)throw new Error('"'+g+'" cannot be encoded with mode '+t.toString($)+`.
 Suggested mode is: `+t.toString(m));switch($===t.KANJI&&!a.isKanjiModeEnabled()&&($=t.BYTE),$){case t.NUMERIC:return new i(g);case t.ALPHANUMERIC:return new r(g);case t.KANJI:return new n(g);case t.BYTE:return new o(g)}}e.fromArray=function(b){return b.reduce(function($,m){return typeof m=="string"?$.push(w(m,null)):m.data&&$.push(w(m.data,m.mode)),$},[])},e.fromString=function(b,$){const m=E(b,a.isKanjiModeEnabled()),D=v(m),x=h(D,$),I=l.find_path(x.map,"start","end"),S=[];for(let C=1;C<I.length-1;C++)S.push(x.table[I[C]].node);return e.fromArray(p(S))},e.rawSplit=function(b){return e.fromArray(E(b,a.isKanjiModeEnabled()))}})(Rt)),Rt}var En;function Di(){if(En)return ht;En=1;const e=Te(),t=zt(),i=$i(),r=Ci(),o=xi(),n=Ei(),s=Ri(),a=jn(),l=Ti(),c=Ii(),f=ki(),E=Ie(),y=Oi();function p(x,I){const S=x.size,C=n.getPositions(I);for(let W=0;W<C.length;W++){const R=C[W][0],k=C[W][1];for(let _=-1;_<=7;_++)if(!(R+_<=-1||S<=R+_))for(let A=-1;A<=7;A++)k+A<=-1||S<=k+A||(_>=0&&_<=6&&(A===0||A===6)||A>=0&&A<=6&&(_===0||_===6)||_>=2&&_<=4&&A>=2&&A<=4?x.set(R+_,k+A,!0,!0):x.set(R+_,k+A,!1,!0))}}function v(x){const I=x.size;for(let S=8;S<I-8;S++){const C=S%2===0;x.set(S,6,C,!0),x.set(6,S,C,!0)}}function h(x,I){const S=o.getPositions(I);for(let C=0;C<S.length;C++){const W=S[C][0],R=S[C][1];for(let k=-2;k<=2;k++)for(let _=-2;_<=2;_++)k===-2||k===2||_===-2||_===2||k===0&&_===0?x.set(W+k,R+_,!0,!0):x.set(W+k,R+_,!1,!0)}}function w(x,I){const S=x.size,C=c.getEncodedBits(I);let W,R,k;for(let _=0;_<18;_++)W=Math.floor(_/3),R=_%3+S-8-3,k=(C>>_&1)===1,x.set(W,R,k,!0),x.set(R,W,k,!0)}function g(x,I,S){const C=x.size,W=f.getEncodedBits(I,S);let R,k;for(R=0;R<15;R++)k=(W>>R&1)===1,R<6?x.set(R,8,k,!0):R<8?x.set(R+1,8,k,!0):x.set(C-15+R,8,k,!0),R<8?x.set(8,C-R-1,k,!0):R<9?x.set(8,15-R-1+1,k,!0):x.set(8,15-R-1,k,!0);x.set(C-8,8,1,!0)}function b(x,I){const S=x.size;let C=-1,W=S-1,R=7,k=0;for(let _=S-1;_>0;_-=2)for(_===6&&_--;;){for(let A=0;A<2;A++)if(!x.isReserved(W,_-A)){let pe=!1;k<I.length&&(pe=(I[k]>>>R&1)===1),x.set(W,_-A,pe),R--,R===-1&&(k++,R=7)}if(W+=C,W<0||S<=W){W-=C,C=-C;break}}}function $(x,I,S){const C=new i;S.forEach(function(A){C.put(A.mode.bit,4),C.put(A.getLength(),E.getCharCountIndicator(A.mode,x)),A.write(C)});const W=e.getSymbolTotalCodewords(x),R=a.getTotalCodewordsCount(x,I),k=(W-R)*8;for(C.getLengthInBits()+4<=k&&C.put(0,4);C.getLengthInBits()%8!==0;)C.putBit(0);const _=(k-C.getLengthInBits())/8;for(let A=0;A<_;A++)C.put(A%2?17:236,8);return m(C,x,I)}function m(x,I,S){const C=e.getSymbolTotalCodewords(I),W=a.getTotalCodewordsCount(I,S),R=C-W,k=a.getBlocksCount(I,S),_=C%k,A=k-_,pe=Math.floor(C/k),Oe=Math.floor(R/k),Yn=Oe+1,Ht=pe-Oe,Jn=new l(Ht);let at=0;const He=new Array(k),Kt=new Array(k);let lt=0;const Xn=new Uint8Array(x.buffer);for(let We=0;We<k;We++){const ut=We<A?Oe:Yn;He[We]=Xn.slice(at,at+ut),Kt[We]=Jn.encode(He[We]),at+=ut,lt=Math.max(lt,ut)}const ct=new Uint8Array(C);let Gt=0,se,ae;for(se=0;se<lt;se++)for(ae=0;ae<k;ae++)se<He[ae].length&&(ct[Gt++]=He[ae][se]);for(se=0;se<Ht;se++)for(ae=0;ae<k;ae++)ct[Gt++]=Kt[ae][se];return ct}function D(x,I,S,C){let W;if(Array.isArray(x))W=y.fromArray(x);else if(typeof x=="string"){let pe=I;if(!pe){const Oe=y.rawSplit(x);pe=c.getBestVersionForData(Oe,S)}W=y.fromString(x,pe||40)}else throw new Error("Invalid data");const R=c.getBestVersionForData(W,S);if(!R)throw new Error("The amount of data is too big to be stored in a QR Code");if(!I)I=R;else if(I<R)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+R+`.
`);const k=$(I,S,W),_=e.getSymbolSize(I),A=new r(_);return p(A,I),v(A),h(A,I),g(A,S,0),I>=7&&w(A,I),b(A,k),isNaN(C)&&(C=s.getBestMask(A,g.bind(null,A,S))),s.applyMask(C,A),g(A,S,C),{modules:A,version:I,errorCorrectionLevel:S,maskPattern:C,segments:W}}return ht.create=function(I,S){if(typeof I>"u"||I==="")throw new Error("No input text");let C=t.M,W,R;return typeof S<"u"&&(C=t.from(S.errorCorrectionLevel,t.M),W=c.from(S.version),R=s.from(S.maskPattern),S.toSJISFunc&&e.setToSJISFunction(S.toSJISFunc)),D(I,W,C,R)},ht}var At={},Pt={},Rn;function qn(){return Rn||(Rn=1,(function(e){function t(i){if(typeof i=="number"&&(i=i.toString()),typeof i!="string")throw new Error("Color should be defined as hex string");let r=i.slice().replace("#","").split("");if(r.length<3||r.length===5||r.length>8)throw new Error("Invalid hex color: "+i);(r.length===3||r.length===4)&&(r=Array.prototype.concat.apply([],r.map(function(n){return[n,n]}))),r.length===6&&r.push("F","F");const o=parseInt(r.join(""),16);return{r:o>>24&255,g:o>>16&255,b:o>>8&255,a:o&255,hex:"#"+r.slice(0,6).join("")}}e.getOptions=function(r){r||(r={}),r.color||(r.color={});const o=typeof r.margin>"u"||r.margin===null||r.margin<0?4:r.margin,n=r.width&&r.width>=21?r.width:void 0,s=r.scale||4;return{width:n,scale:n?4:s,margin:o,color:{dark:t(r.color.dark||"#000000ff"),light:t(r.color.light||"#ffffffff")},type:r.type,rendererOpts:r.rendererOpts||{}}},e.getScale=function(r,o){return o.width&&o.width>=r+o.margin*2?o.width/(r+o.margin*2):o.scale},e.getImageWidth=function(r,o){const n=e.getScale(r,o);return Math.floor((r+o.margin*2)*n)},e.qrToImageData=function(r,o,n){const s=o.modules.size,a=o.modules.data,l=e.getScale(s,n),c=Math.floor((s+n.margin*2)*l),f=n.margin*l,E=[n.color.light,n.color.dark];for(let y=0;y<c;y++)for(let p=0;p<c;p++){let v=(y*c+p)*4,h=n.color.light;if(y>=f&&p>=f&&y<c-f&&p<c-f){const w=Math.floor((y-f)/l),g=Math.floor((p-f)/l);h=E[a[w*s+g]?1:0]}r[v++]=h.r,r[v++]=h.g,r[v++]=h.b,r[v]=h.a}}})(Pt)),Pt}var _n;function Mi(){return _n||(_n=1,(function(e){const t=qn();function i(o,n,s){o.clearRect(0,0,n.width,n.height),n.style||(n.style={}),n.height=s,n.width=s,n.style.height=s+"px",n.style.width=s+"px"}function r(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}e.render=function(n,s,a){let l=a,c=s;typeof l>"u"&&(!s||!s.getContext)&&(l=s,s=void 0),s||(c=r()),l=t.getOptions(l);const f=t.getImageWidth(n.modules.size,l),E=c.getContext("2d"),y=E.createImageData(f,f);return t.qrToImageData(y.data,n,l),i(E,c,f),E.putImageData(y,0,0),c},e.renderToDataURL=function(n,s,a){let l=a;typeof l>"u"&&(!s||!s.getContext)&&(l=s,s=void 0),l||(l={});const c=e.render(n,s,l),f=l.type||"image/png",E=l.rendererOpts||{};return c.toDataURL(f,E.quality)}})(At)),At}var Bt={},Sn;function ji(){if(Sn)return Bt;Sn=1;const e=qn();function t(o,n){const s=o.a/255,a=n+'="'+o.hex+'"';return s<1?a+" "+n+'-opacity="'+s.toFixed(2).slice(1)+'"':a}function i(o,n,s){let a=o+n;return typeof s<"u"&&(a+=" "+s),a}function r(o,n,s){let a="",l=0,c=!1,f=0;for(let E=0;E<o.length;E++){const y=Math.floor(E%n),p=Math.floor(E/n);!y&&!c&&(c=!0),o[E]?(f++,E>0&&y>0&&o[E-1]||(a+=c?i("M",y+s,.5+p+s):i("m",l,0),l=0,c=!1),y+1<n&&o[E+1]||(a+=i("h",f),f=0)):l++}return a}return Bt.render=function(n,s,a){const l=e.getOptions(s),c=n.modules.size,f=n.modules.data,E=c+l.margin*2,y=l.color.light.a?"<path "+t(l.color.light,"fill")+' d="M0 0h'+E+"v"+E+'H0z"/>':"",p="<path "+t(l.color.dark,"stroke")+' d="'+r(f,c,l.margin)+'"/>',v='viewBox="0 0 '+E+" "+E+'"',w='<svg xmlns="http://www.w3.org/2000/svg" '+(l.width?'width="'+l.width+'" height="'+l.width+'" ':"")+v+' shape-rendering="crispEdges">'+y+p+`</svg>
`;return typeof a=="function"&&a(null,w),w},Bt}var Tn;function zi(){if(Tn)return Ae;Tn=1;const e=vi(),t=Di(),i=Mi(),r=ji();function o(n,s,a,l,c){const f=[].slice.call(arguments,1),E=f.length,y=typeof f[E-1]=="function";if(!y&&!e())throw new Error("Callback required as last argument");if(y){if(E<2)throw new Error("Too few arguments provided");E===2?(c=a,a=s,s=l=void 0):E===3&&(s.getContext&&typeof c>"u"?(c=l,l=void 0):(c=l,l=a,a=s,s=void 0))}else{if(E<1)throw new Error("Too few arguments provided");return E===1?(a=s,s=l=void 0):E===2&&!s.getContext&&(l=a,a=s,s=void 0),new Promise(function(p,v){try{const h=t.create(a,l);p(n(h,s,l))}catch(h){v(h)}})}try{const p=t.create(a,l);c(null,n(p,s,l))}catch(p){c(p)}}return Ae.create=t.create,Ae.toCanvas=o.bind(null,i.render),Ae.toDataURL=o.bind(null,i.renderToDataURL),Ae.toString=o.bind(null,function(n,s,a){return r.render(n,a)}),Ae}var Ui=zi();const qi=oi(Ui),Fi=.1,In=2.5,le=7;function Lt(e,t,i){return e===t?!1:(e-t<0?t-e:e-t)<=i+Fi}function Vi(e,t){const i=Array.prototype.slice.call(qi.create(e,{errorCorrectionLevel:t}).modules.data,0),r=Math.sqrt(i.length);return i.reduce((o,n,s)=>(s%r===0?o.push([n]):o[o.length-1].push(n))&&o,[])}const Hi={generate({uri:e,size:t,logoSize:i,padding:r=8,dotColor:o="var(--apkt-colors-black)"}){const s=[],a=Vi(e,"Q"),l=(t-2*r)/a.length,c=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];c.forEach(({x:h,y:w})=>{const g=(a.length-le)*l*h+r,b=(a.length-le)*l*w+r,$=.45;for(let m=0;m<c.length;m+=1){const D=l*(le-m*2);s.push(Me`
            <rect
              fill=${m===2?"var(--apkt-colors-black)":"var(--apkt-colors-white)"}
              width=${m===0?D-10:D}
              rx= ${m===0?(D-10)*$:D*$}
              ry= ${m===0?(D-10)*$:D*$}
              stroke=${o}
              stroke-width=${m===0?10:0}
              height=${m===0?D-10:D}
              x= ${m===0?b+l*m+10/2:b+l*m}
              y= ${m===0?g+l*m+10/2:g+l*m}
            />
          `)}});const f=Math.floor((i+25)/l),E=a.length/2-f/2,y=a.length/2+f/2-1,p=[];a.forEach((h,w)=>{h.forEach((g,b)=>{if(a[w][b]&&!(w<le&&b<le||w>a.length-(le+1)&&b<le||w<le&&b>a.length-(le+1))&&!(w>E&&w<y&&b>E&&b<y)){const $=w*l+l/2+r,m=b*l+l/2+r;p.push([$,m])}})});const v={};return p.forEach(([h,w])=>{v[h]?v[h]?.push(w):v[h]=[w]}),Object.entries(v).map(([h,w])=>{const g=w.filter(b=>w.every($=>!Lt(b,$,l)));return[Number(h),g]}).forEach(([h,w])=>{w.forEach(g=>{s.push(Me`<circle cx=${h} cy=${g} fill=${o} r=${l/In} />`)})}),Object.entries(v).filter(([h,w])=>w.length>1).map(([h,w])=>{const g=w.filter(b=>w.some($=>Lt(b,$,l)));return[Number(h),g]}).map(([h,w])=>{w.sort((b,$)=>b<$?-1:1);const g=[];for(const b of w){const $=g.find(m=>m.some(D=>Lt(b,D,l)));$?$.push(b):g.push([b])}return[h,g.map(b=>[b[0],b[b.length-1]])]}).forEach(([h,w])=>{w.forEach(([g,b])=>{s.push(Me`
              <line
                x1=${h}
                x2=${h}
                y1=${g}
                y2=${b}
                stroke=${o}
                stroke-width=${l/(In/2)}
                stroke-linecap="round"
              />
            `)})}),s}},Ki=z`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    background-color: ${({colors:e})=>e.white};
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  :host {
    border-radius: ${({borderRadius:e})=>e[4]};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    box-shadow: inset 0 0 0 4px ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[6]};
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: #3396ff !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }

  wui-icon > svg {
    width: inherit;
    height: inherit;
  }
`;var be=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let ne=class extends M{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`--local-size: ${this.size}px`,u`<wui-flex
      alignItems="center"
      justifyContent="center"
      class="wui-qr-code"
      direction="column"
      gap="4"
      width="100%"
      style="height: 100%"
    >
      ${this.templateVisual()} ${this.templateSvg()}
    </wui-flex>`}templateSvg(){return Me`
      <svg height=${this.size} width=${this.size}>
        ${Hi.generate({uri:this.uri,size:this.size,logoSize:this.arenaClear?0:this.size/4})}
      </svg>
    `}templateVisual(){return this.imageSrc?u`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?u`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:u`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};ne.styles=[G,Ki];be([d()],ne.prototype,"uri",void 0);be([d({type:Number})],ne.prototype,"size",void 0);be([d()],ne.prototype,"theme",void 0);be([d()],ne.prototype,"imageSrc",void 0);be([d()],ne.prototype,"alt",void 0);be([d({type:Boolean})],ne.prototype,"arenaClear",void 0);be([d({type:Boolean})],ne.prototype,"farcaster",void 0);ne=be([O("wui-qr-code")],ne);const Gi=z`
  :host {
    display: block;
    background: linear-gradient(
      90deg,
      ${({tokens:e})=>e.theme.foregroundSecondary} 0%,
      ${({tokens:e})=>e.theme.foregroundTertiary} 50%,
      ${({tokens:e})=>e.theme.foregroundSecondary} 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1s ease-in-out infinite;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  :host([data-rounded='true']) {
    border-radius: ${({borderRadius:e})=>e[16]};
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;var Fe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Re=class extends M{constructor(){super(...arguments),this.width="",this.height="",this.variant="default",this.rounded=!1}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
    `,this.dataset.rounded=this.rounded?"true":"false",u`<slot></slot>`}};Re.styles=[Gi];Fe([d()],Re.prototype,"width",void 0);Fe([d()],Re.prototype,"height",void 0);Fe([d()],Re.prototype,"variant",void 0);Fe([d({type:Boolean})],Re.prototype,"rounded",void 0);Re=Fe([O("wui-shimmer")],Re);const Qi=z`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var Fn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Xe=class extends U{constructor(){super(),this.basic=!1,this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate)}firstUpdated(){this.basic||F.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet?.name??"WalletConnect",platform:"qrcode",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:P.state.view}})}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.forEach(t=>t()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),u`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","5","5","5"]}
        gap="5"
      >
        <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>
        <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;const t=this.getBoundingClientRect().width-40,i=this.wallet?this.wallet.name:void 0;L.setWcLinking(void 0),L.setRecentWallet(this.wallet);let r=this.uri;if(this.wallet?.mobile_link){const{redirect:o}=B.formatNativeUrl(this.wallet?.mobile_link,this.uri,null);r=o}return u` <wui-qr-code
      size=${t}
      theme=${Ot.state.themeMode}
      uri=${r}
      imageSrc=${j(we.getWalletImage(this.wallet))}
      color=${j(Ot.state.themeVariables["--w3m-qr-color"])}
      alt=${j(i)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){const t=!this.uri||!this.ready;return u`<wui-button
      .disabled=${t}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      Copy link
      <wui-icon size="sm" color="inherit" name="copy" slot="iconRight"></wui-icon>
    </wui-button>`}};Xe.styles=Qi;Fn([d({type:Boolean})],Xe.prototype,"basic",void 0);Xe=Fn([O("w3m-connecting-wc-qrcode")],Xe);var Yi=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let kn=class extends M{constructor(){if(super(),this.wallet=P.state.data?.wallet,!this.wallet)throw new Error("w3m-connecting-wc-unsupported: No wallet provided");F.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:P.state.view}})}render(){return u`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${j(we.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="md-regular" color="primary">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};kn=Yi([O("w3m-connecting-wc-unsupported")],kn);var Vn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Mt=class extends U{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw new Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=Nn.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(L.subscribeKey("wcUri",()=>{this.updateLoadingState()})),F.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:P.state.view}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){if(this.wallet?.webapp_link&&this.uri)try{this.error=!1;const{webapp_link:t,name:i}=this.wallet,{redirect:r,href:o}=B.formatUniversalUrl(t,this.uri);L.setWcLinking({name:i,href:o}),L.setRecentWallet(this.wallet),B.openHref(r,"_blank")}catch{this.error=!0}}};Vn([T()],Mt.prototype,"isLoading",void 0);Mt=Vn([O("w3m-connecting-wc-web")],Mt);const Ji=z`
  :host([data-mobile-fullscreen='true']) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :host([data-mobile-fullscreen='true']) wui-ux-by-reown {
    margin-top: auto;
  }
`;var ke=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let de=class extends M{constructor(){super(),this.wallet=P.state.data?.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!q.state.siwx,this.remoteFeatures=q.state.remoteFeatures,this.displayBranding=!0,this.basic=!1,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(q.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){return q.state.enableMobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),u`
      ${this.headerTemplate()}
      <div class="platform-container">${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){return!this.remoteFeatures?.reownBranding||!this.displayBranding?null:u`<wui-ux-by-reown></wui-ux-by-reown>`}async initializeConnection(t=!1){if(!(this.platform==="browser"||q.state.manualWCControl&&!t))try{const{wcPairingExpiry:i,status:r}=L.state,{redirectView:o}=P.state.data??{};if(t||q.state.enableEmbedded||B.isPairingExpired(i)||r==="connecting"){const n=L.getConnections(ge.state.activeChain),s=this.remoteFeatures?.multiWallet,a=n.length>0;await L.connectWalletConnect({cache:"never"}),this.isSiwxEnabled||(a&&s?(P.replace("ProfileWallets"),ze.showSuccess("New Wallet Added")):o?P.replace(o):Pn.close())}}catch(i){if(i instanceof Error&&i.message.includes("An error occurred when attempting to switch chain")&&!q.state.enableNetworkSwitch&&ge.state.activeChain){ge.setActiveCaipNetwork(ei.getUnsupportedNetwork(`${ge.state.activeChain}:${ge.state.activeCaipNetwork?.id}`)),ge.showUnsupportedChainUI();return}i instanceof Bn&&i.originalName===Ln.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?F.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:i.message}}):F.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:i?.message??"Unknown"}}),L.setWcError(!0),ze.showError(i.message??"Connection error"),L.resetWcConnection(),P.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;const{mobile_link:t,desktop_link:i,webapp_link:r,injected:o,rdns:n}=this.wallet,s=o?.map(({injected_id:v})=>v).filter(Boolean),a=[...n?[n]:s??[]],l=q.state.isUniversalProvider?!1:a.length,c=t,f=r,E=L.checkInstalled(a),y=l&&E,p=i&&!B.isMobile();y&&!ge.state.noAdapters&&this.platforms.push("browser"),c&&this.platforms.push(B.isMobile()?"mobile":"qrcode"),f&&this.platforms.push("web"),p&&this.platforms.push("desktop"),!y&&l&&!ge.state.noAdapters&&this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return u`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return u`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return u`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return u`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return u`<w3m-connecting-wc-qrcode ?basic=${this.basic}></w3m-connecting-wc-qrcode>`;default:return u`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?u`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(t){const i=this.shadowRoot?.querySelector("div");i&&(await i.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=t,i.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};de.styles=Ji;ke([T()],de.prototype,"platform",void 0);ke([T()],de.prototype,"platforms",void 0);ke([T()],de.prototype,"isSiwxEnabled",void 0);ke([T()],de.prototype,"remoteFeatures",void 0);ke([d({type:Boolean})],de.prototype,"displayBranding",void 0);ke([d({type:Boolean})],de.prototype,"basic",void 0);de=ke([O("w3m-connecting-wc-view")],de);var Ut=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Ze=class extends M{constructor(){super(),this.unsubscribe=[],this.isMobile=B.isMobile(),this.remoteFeatures=q.state.remoteFeatures,this.unsubscribe.push(q.subscribeKey("remoteFeatures",t=>this.remoteFeatures=t))}disconnectedCallback(){this.unsubscribe.forEach(t=>t())}render(){if(this.isMobile){const{featured:t,recommended:i}=N.state,{customWallets:r}=q.state,o=ti.getRecentWallets(),n=t.length||i.length||r?.length||o.length;return u`<wui-flex flexDirection="column" gap="2" .margin=${["1","3","3","3"]}>
        ${n?u`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return u`<wui-flex flexDirection="column" .padding=${["0","0","4","0"]}>
        <w3m-connecting-wc-view ?basic=${!0} .displayBranding=${!1}></w3m-connecting-wc-view>
        <wui-flex flexDirection="column" .padding=${["0","3","0","3"]}>
          <w3m-all-wallets-widget></w3m-all-wallets-widget>
        </wui-flex>
      </wui-flex>
      ${this.reownBrandingTemplate()} `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding?u` <wui-flex flexDirection="column" .padding=${["1","0","1","0"]}>
      <wui-ux-by-reown></wui-ux-by-reown>
    </wui-flex>`:null}};Ut([T()],Ze.prototype,"isMobile",void 0);Ut([T()],Ze.prototype,"remoteFeatures",void 0);Ze=Ut([O("w3m-connecting-wc-basic-view")],Ze);/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Xi=e=>e.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const je=(e,t)=>{const i=e._$AN;if(i===void 0)return!1;for(const r of i)r._$AO?.(t,!1),je(r,t);return!0},et=e=>{let t,i;do{if((t=e._$AM)===void 0)break;i=t._$AN,i.delete(e),e=t}while(i?.size===0)},Hn=e=>{for(let t;t=e._$AM;e=t){let i=t._$AN;if(i===void 0)t._$AN=i=new Set;else if(i.has(e))break;i.add(e),tr(t)}};function Zi(e){this._$AN!==void 0?(et(this),this._$AM=e,Hn(this)):this._$AM=e}function er(e,t=!1,i=0){const r=this._$AH,o=this._$AN;if(o!==void 0&&o.size!==0)if(t)if(Array.isArray(r))for(let n=i;n<r.length;n++)je(r[n],!1),et(r[n]);else r!=null&&(je(r,!1),et(r));else je(this,e)}const tr=e=>{e.type==ii.CHILD&&(e._$AP??=er,e._$AQ??=Zi)};class nr extends ni{constructor(){super(...arguments),this._$AN=void 0}_$AT(t,i,r){super._$AT(t,i,r),Hn(this),this.isConnected=t._$AU}_$AO(t,i=!0){t!==this.isConnected&&(this.isConnected=t,t?this.reconnected?.():this.disconnected?.()),i&&(je(this,t),et(this))}setValue(t){if(Xi(this._$Ct))this._$Ct._$AI(t,this);else{const i=[...this._$Ct._$AH];i[this._$Ci]=t,this._$Ct._$AI(i,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const qt=()=>new ir;class ir{}const Nt=new WeakMap,Ft=ri(class extends nr{render(e){return Yt}update(e,[t]){const i=t!==this.G;return i&&this.G!==void 0&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),Yt}rt(e){if(this.isConnected||(e=void 0),typeof this.G=="function"){const t=this.ht??globalThis;let i=Nt.get(t);i===void 0&&(i=new WeakMap,Nt.set(t,i)),i.get(this.G)!==void 0&&this.G.call(this.ht,void 0),i.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return typeof this.G=="function"?Nt.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),rr=z`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    user-select: none;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({colors:e})=>e.neutrals300};
    border-radius: ${({borderRadius:e})=>e.round};
    border: 1px solid transparent;
    will-change: border;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  span:before {
    content: '';
    position: absolute;
    background-color: ${({colors:e})=>e.white};
    border-radius: 50%;
  }

  /* -- Sizes --------------------------------------------------------- */
  label[data-size='lg'] {
    width: 48px;
    height: 32px;
  }

  label[data-size='md'] {
    width: 40px;
    height: 28px;
  }

  label[data-size='sm'] {
    width: 32px;
    height: 22px;
  }

  label[data-size='lg'] > span:before {
    height: 24px;
    width: 24px;
    left: 4px;
    top: 3px;
  }

  label[data-size='md'] > span:before {
    height: 20px;
    width: 20px;
    left: 4px;
    top: 3px;
  }

  label[data-size='sm'] > span:before {
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
  }

  /* -- Focus states --------------------------------------------------- */
  input:focus-visible:not(:checked) + span,
  input:focus:not(:checked) + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    background-color: ${({tokens:e})=>e.theme.textTertiary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  input:focus-visible:checked + span,
  input:focus:checked + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  /* -- Checked states --------------------------------------------------- */
  input:checked + span {
    background-color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  label[data-size='lg'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='md'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='sm'] > input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }

  /* -- Hover states ------------------------------------------------------- */
  label:hover > input:not(:checked):not(:disabled) + span {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  label:hover > input:checked:not(:disabled) + span {
    background-color: ${({colors:e})=>e.accent080};
  }

  /* -- Disabled state --------------------------------------------------- */
  label:has(input:disabled) {
    pointer-events: none;
    user-select: none;
  }

  input:not(:checked):disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:checked:disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:not(:checked):disabled + span::before {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  input:checked:disabled + span::before {
    background-color: ${({tokens:e})=>e.theme.textTertiary};
  }
`;var st=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Be=class extends M{constructor(){super(...arguments),this.inputElementRef=qt(),this.checked=!1,this.disabled=!1,this.size="md"}render(){return u`
      <label data-size=${this.size}>
        <input
          ${Ft(this.inputElementRef)}
          type="checkbox"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){this.dispatchEvent(new CustomEvent("switchChange",{detail:this.inputElementRef.value?.checked,bubbles:!0,composed:!0}))}};Be.styles=[G,he,rr];st([d({type:Boolean})],Be.prototype,"checked",void 0);st([d({type:Boolean})],Be.prototype,"disabled",void 0);st([d()],Be.prototype,"size",void 0);Be=st([O("wui-toggle")],Be);const or=z`
  :host {
    height: auto;
  }

  :host > wui-flex {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[2]} ${({spacing:e})=>e[3]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
    box-shadow: inset 0 0 0 1px ${({tokens:e})=>e.theme.foregroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var Kn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let tt=class extends M{constructor(){super(...arguments),this.checked=!1}render(){return u`
      <wui-flex>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-toggle
          ?checked=${this.checked}
          size="sm"
          @switchChange=${this.handleToggleChange.bind(this)}
        ></wui-toggle>
      </wui-flex>
    `}handleToggleChange(t){t.stopPropagation(),this.checked=t.detail,this.dispatchSwitchEvent()}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("certifiedSwitchChange",{detail:this.checked,bubbles:!0,composed:!0}))}};tt.styles=[G,he,or];Kn([d({type:Boolean})],tt.prototype,"checked",void 0);tt=Kn([O("wui-certified-switch")],tt);const sr=z`
  :host {
    position: relative;
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    gap: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.textPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  .wui-input-text-container {
    position: relative;
    display: flex;
  }

  input {
    width: 100%;
    border-radius: ${({borderRadius:e})=>e[4]};
    color: inherit;
    background: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[3]} ${({spacing:e})=>e[10]};
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
  }

  input[data-size='lg'] {
    padding: ${({spacing:e})=>e[4]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[4]} ${({spacing:e})=>e[10]};
  }

  @media (hover: hover) and (pointer: fine) {
    input:hover:enabled {
      border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    }
  }

  input:disabled {
    cursor: unset;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  input::placeholder {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  input:focus:enabled {
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    -webkit-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    -moz-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
  }

  div.wui-input-text-container:has(input:disabled) {
    opacity: 0.5;
  }

  wui-icon.wui-input-text-left-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    left: ${({spacing:e})=>e[4]};
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  button.wui-input-text-submit-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: ${({borderRadius:e})=>e[2]};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button.wui-input-text-submit-button:disabled {
    opacity: 1;
  }

  button.wui-input-text-submit-button.loading wui-icon {
    animation: spin 1s linear infinite;
  }

  button.wui-input-text-submit-button:hover {
    background: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  input:has(+ .wui-input-text-submit-button) {
    padding-right: ${({spacing:e})=>e[12]};
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  /* -- Keyframes --------------------------------------------------- */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;var J=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let V=class extends M{constructor(){super(...arguments),this.inputElementRef=qt(),this.disabled=!1,this.loading=!1,this.placeholder="",this.type="text",this.value="",this.size="md"}render(){return u` <div class="wui-input-text-container">
        ${this.templateLeftIcon()}
        <input
          data-size=${this.size}
          ${Ft(this.inputElementRef)}
          data-testid="wui-input-text"
          type=${this.type}
          enterkeyhint=${j(this.enterKeyHint)}
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @input=${this.dispatchInputChangeEvent.bind(this)}
          @keydown=${this.onKeyDown}
          .value=${this.value||""}
        />
        ${this.templateSubmitButton()}
        <slot class="wui-input-text-slot"></slot>
      </div>
      ${this.templateError()} ${this.templateWarning()}`}templateLeftIcon(){return this.icon?u`<wui-icon
        class="wui-input-text-left-icon"
        size="md"
        data-size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}templateSubmitButton(){return this.onSubmit?u`<button
        class="wui-input-text-submit-button ${this.loading?"loading":""}"
        @click=${this.onSubmit?.bind(this)}
        ?disabled=${this.disabled||this.loading}
      >
        ${this.loading?u`<wui-icon name="spinner" size="md"></wui-icon>`:u`<wui-icon name="chevronRight" size="md"></wui-icon>`}
      </button>`:null}templateError(){return this.errorText?u`<wui-text variant="sm-regular" color="error">${this.errorText}</wui-text>`:null}templateWarning(){return this.warningText?u`<wui-text variant="sm-regular" color="warning">${this.warningText}</wui-text>`:null}dispatchInputChangeEvent(){this.dispatchEvent(new CustomEvent("inputChange",{detail:this.inputElementRef.value?.value,bubbles:!0,composed:!0}))}};V.styles=[G,he,sr];J([d()],V.prototype,"icon",void 0);J([d({type:Boolean})],V.prototype,"disabled",void 0);J([d({type:Boolean})],V.prototype,"loading",void 0);J([d()],V.prototype,"placeholder",void 0);J([d()],V.prototype,"type",void 0);J([d()],V.prototype,"value",void 0);J([d()],V.prototype,"errorText",void 0);J([d()],V.prototype,"warningText",void 0);J([d()],V.prototype,"onSubmit",void 0);J([d()],V.prototype,"size",void 0);J([d({attribute:!1})],V.prototype,"onKeyDown",void 0);V=J([O("wui-input-text")],V);const ar=z`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.iconDefault};
    cursor: pointer;
    padding: ${({spacing:e})=>e[2]};
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
  }

  @media (hover: hover) {
    wui-icon:hover {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }
`;var Gn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let nt=class extends M{constructor(){super(...arguments),this.inputComponentRef=qt(),this.inputValue=""}render(){return u`
      <wui-input-text
        ${Ft(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
        @inputChange=${this.onInputChange}
      >
        ${this.inputValue?u`<wui-icon
              @click=${this.clearValue}
              color="inherit"
              size="sm"
              name="close"
            ></wui-icon>`:null}
      </wui-input-text>
    `}onInputChange(t){this.inputValue=t.detail||""}clearValue(){const i=this.inputComponentRef.value?.inputElementRef.value;i&&(i.value="",this.inputValue="",i.focus(),i.dispatchEvent(new Event("input")))}};nt.styles=[G,ar];Gn([d()],nt.prototype,"inputValue",void 0);nt=Gn([O("wui-search-bar")],nt);const lr=Me`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,cr=z`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 104px;
    width: 104px;
    row-gap: ${({spacing:e})=>e[2]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--apkt-path-network);
    clip-path: var(--apkt-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: ${({tokens:e})=>e.theme.foregroundSecondary};
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var Qn=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let it=class extends M{constructor(){super(...arguments),this.type="wallet"}render(){return u`
      ${this.shimmerTemplate()}
      <wui-shimmer width="80px" height="20px"></wui-shimmer>
    `}shimmerTemplate(){return this.type==="network"?u` <wui-shimmer data-type=${this.type} width="48px" height="54px"></wui-shimmer>
        ${lr}`:u`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}};it.styles=[G,he,cr];Qn([d()],it.prototype,"type",void 0);it=Qn([O("wui-card-select-loader")],it);const ur=On`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var X=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let H=class extends M{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&ce.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&ce.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&ce.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&ce.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&ce.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&ce.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&ce.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&ce.getSpacingStyles(this.margin,3)};
    `,u`<slot></slot>`}};H.styles=[G,ur];X([d()],H.prototype,"gridTemplateRows",void 0);X([d()],H.prototype,"gridTemplateColumns",void 0);X([d()],H.prototype,"justifyItems",void 0);X([d()],H.prototype,"alignItems",void 0);X([d()],H.prototype,"justifyContent",void 0);X([d()],H.prototype,"alignContent",void 0);X([d()],H.prototype,"columnGap",void 0);X([d()],H.prototype,"rowGap",void 0);X([d()],H.prototype,"gap",void 0);X([d()],H.prototype,"padding",void 0);X([d()],H.prototype,"margin",void 0);H=X([O("wui-grid")],H);const dr=z`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: ${({spacing:e})=>e[2]};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[0]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: clamp(0px, ${({borderRadius:e})=>e[4]}, 20px);
    transition:
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: ${({tokens:e})=>e.theme.textPrimary};
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }

  button:disabled > wui-flex > wui-text {
    color: ${({tokens:e})=>e.core.glass010};
  }

  [data-selected='true'] {
    background-color: ${({colors:e})=>e.accent020};
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: ${({colors:e})=>e.accent010};
    }
  }

  [data-selected='true']:active:enabled {
    background-color: ${({colors:e})=>e.accent010};
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var re=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Q=class extends M{constructor(){super(),this.observer=new IntersectionObserver(()=>{}),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.isImpressed=!1,this.explorerId="",this.walletQuery="",this.certified=!1,this.displayIndex=0,this.wallet=void 0,this.observer=new IntersectionObserver(t=>{t.forEach(i=>{i.isIntersecting?(this.visible=!0,this.fetchImageSrc(),this.sendImpressionEvent()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){const t=this.wallet?.badge_type==="certified";return u`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="1">
          <wui-text
            variant="md-regular"
            color="inherit"
            class=${j(t?"certified":void 0)}
            >${this.wallet?.name}</wui-text
          >
          ${t?u`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){return!this.visible&&!this.imageSrc||this.imageLoading?this.shimmerTemplate():u`
      <wui-wallet-image
        size="lg"
        imageSrc=${j(this.imageSrc)}
        name=${j(this.wallet?.name)}
        .installed=${this.wallet?.installed??!1}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `}shimmerTemplate(){return u`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=we.getWalletImage(this.wallet),!this.imageSrc&&(this.imageLoading=!0,this.imageSrc=await we.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}sendImpressionEvent(){!this.wallet||this.isImpressed||(this.isImpressed=!0,F.sendWalletImpressionEvent({name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.explorerId,view:P.state.view,query:this.walletQuery,certified:this.certified,displayIndex:this.displayIndex}))}};Q.styles=dr;re([T()],Q.prototype,"visible",void 0);re([T()],Q.prototype,"imageSrc",void 0);re([T()],Q.prototype,"imageLoading",void 0);re([T()],Q.prototype,"isImpressed",void 0);re([d()],Q.prototype,"explorerId",void 0);re([d()],Q.prototype,"walletQuery",void 0);re([d()],Q.prototype,"certified",void 0);re([d()],Q.prototype,"displayIndex",void 0);re([d({type:Object})],Q.prototype,"wallet",void 0);Q=re([O("w3m-all-wallets-list-item")],Q);const hr=z`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  w3m-all-wallets-list-item {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-inout-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-loading-spinner {
    padding-top: ${({spacing:e})=>e[4]};
    padding-bottom: ${({spacing:e})=>e[4]};
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var ye=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};const Wn="local-paginator";let ie=class extends M{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!N.state.wallets.length,this.wallets=N.state.wallets,this.recommended=N.state.recommended,this.featured=N.state.featured,this.filteredWallets=N.state.filteredWallets,this.mobileFullScreen=q.state.enableMobileFullScreen,this.unsubscribe.push(N.subscribeKey("wallets",t=>this.wallets=t),N.subscribeKey("recommended",t=>this.recommended=t),N.subscribeKey("featured",t=>this.featured=t),N.subscribeKey("filteredWallets",t=>this.filteredWallets=t))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(t=>t()),this.paginationObserver?.disconnect()}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),u`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","3","3","3"]}
        gap="2"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){this.loading=!0;const t=this.shadowRoot?.querySelector("wui-grid");t&&(await N.fetchWalletsByPage({page:1}),await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(t,i){return[...Array(t)].map(()=>u`
        <wui-card-select-loader type="wallet" id=${j(i)}></wui-card-select-loader>
      `)}getWallets(){const t=[...this.featured,...this.recommended];this.filteredWallets?.length>0?t.push(...this.filteredWallets):t.push(...this.wallets);const i=B.uniqueBy(t,"id"),r=Dt.markWalletsAsInstalled(i);return Dt.markWalletsWithDisplayIndex(r)}walletsTemplate(){return this.getWallets().map((i,r)=>u`
        <w3m-all-wallets-list-item
          data-testid="wallet-search-item-${i.id}"
          @click=${()=>this.onConnectWallet(i)}
          .wallet=${i}
          explorerId=${i.id}
          certified=${this.badge==="certified"}
          displayIndex=${r}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){const{wallets:t,recommended:i,featured:r,count:o,mobileFilteredOutWalletsLength:n}=N.state,s=window.innerWidth<352?3:4,a=t.length+i.length;let c=Math.ceil(a/s)*s-a+s;return c-=t.length?r.length%s:0,o===0&&r.length>0?null:o===0||[...r,...t,...i].length<o-(n??0)?this.shimmerTemplate(c,Wn):null}createPaginationObserver(){const t=this.shadowRoot?.querySelector(`#${Wn}`);t&&(this.paginationObserver=new IntersectionObserver(([i])=>{if(i?.isIntersecting&&!this.loading){const{page:r,count:o,wallets:n}=N.state;n.length<o&&N.fetchWalletsByPage({page:r+1})}}),this.paginationObserver.observe(t))}onConnectWallet(t){K.selectWalletConnector(t)}};ie.styles=hr;ye([T()],ie.prototype,"loading",void 0);ye([T()],ie.prototype,"wallets",void 0);ye([T()],ie.prototype,"recommended",void 0);ye([T()],ie.prototype,"featured",void 0);ye([T()],ie.prototype,"filteredWallets",void 0);ye([T()],ie.prototype,"badge",void 0);ye([T()],ie.prototype,"mobileFullScreen",void 0);ie=ye([O("w3m-all-wallets-list")],ie);const fr=On`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
    height: auto;
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var Ve=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let _e=class extends M{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.mobileFullScreen=q.state.enableMobileFullScreen,this.query=""}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.onSearch(),this.loading?u`<wui-loading-spinner color="accent-primary"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await N.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){const{search:t}=N.state,i=Dt.markWalletsAsInstalled(t);return t.length?u`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","3","3","3"]}
        rowGap="4"
        columngap="2"
        justifyContent="space-between"
      >
        ${i.map((r,o)=>u`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(r)}
              .wallet=${r}
              data-testid="wallet-search-item-${r.id}"
              explorerId=${r.id}
              certified=${this.badge==="certified"}
              walletQuery=${this.query}
              displayIndex=${o}
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:u`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="3"
          flexDirection="column"
        >
          <wui-icon-box size="lg" color="default" icon="wallet"></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="secondary" variant="md-medium">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(t){K.selectWalletConnector(t)}};_e.styles=fr;Ve([T()],_e.prototype,"loading",void 0);Ve([T()],_e.prototype,"mobileFullScreen",void 0);Ve([d()],_e.prototype,"query",void 0);Ve([d()],_e.prototype,"badge",void 0);_e=Ve([O("w3m-all-wallets-search")],_e);var Vt=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let rt=class extends M{constructor(){super(...arguments),this.search="",this.badge=void 0,this.onDebouncedSearch=B.debounce(t=>{this.search=t})}render(){const t=this.search.length>=2;return u`
      <wui-flex .padding=${["1","3","3","3"]} gap="2" alignItems="center">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${this.badge==="certified"}
          @certifiedSwitchChange=${this.onCertifiedSwitchChange.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${t||this.badge?u`<w3m-all-wallets-search
            query=${this.search}
            .badge=${this.badge}
          ></w3m-all-wallets-search>`:u`<w3m-all-wallets-list .badge=${this.badge}></w3m-all-wallets-list>`}
    `}onInputChange(t){this.onDebouncedSearch(t.detail)}onCertifiedSwitchChange(t){t.detail?(this.badge="certified",ze.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})):this.badge=void 0}qrButtonTemplate(){return B.isMobile()?u`
        <wui-icon-box
          size="xl"
          iconSize="xl"
          color="accent-primary"
          icon="qrCode"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){P.push("ConnectingWalletConnect")}};Vt([T()],rt.prototype,"search",void 0);Vt([T()],rt.prototype,"badge",void 0);rt=Vt([O("w3m-all-wallets-view")],rt);const pr=z`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, scale;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-image {
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var oe=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let Y=class extends M{constructor(){super(...arguments),this.imageSrc="google",this.loading=!1,this.disabled=!1,this.rightIcon=!0,this.rounded=!1,this.fullSize=!1}render(){return this.dataset.rounded=this.rounded?"true":"false",u`
      <button
        ?disabled=${this.loading?!0:!!this.disabled}
        data-loading=${this.loading}
        tabindex=${j(this.tabIdx)}
      >
        <wui-flex gap="2" alignItems="center">
          ${this.templateLeftIcon()}
          <wui-flex gap="1">
            <slot></slot>
          </wui-flex>
        </wui-flex>
        ${this.templateRightIcon()}
      </button>
    `}templateLeftIcon(){return this.icon?u`<wui-image
        icon=${this.icon}
        iconColor=${j(this.iconColor)}
        ?boxed=${!0}
        ?rounded=${this.rounded}
      ></wui-image>`:u`<wui-image
      ?boxed=${!0}
      ?rounded=${this.rounded}
      ?fullSize=${this.fullSize}
      src=${this.imageSrc}
    ></wui-image>`}templateRightIcon(){return this.rightIcon?this.loading?u`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:u`<wui-icon name="chevronRight" size="lg" color="default"></wui-icon>`:null}};Y.styles=[G,he,pr];oe([d()],Y.prototype,"imageSrc",void 0);oe([d()],Y.prototype,"icon",void 0);oe([d()],Y.prototype,"iconColor",void 0);oe([d({type:Boolean})],Y.prototype,"loading",void 0);oe([d()],Y.prototype,"tabIdx",void 0);oe([d({type:Boolean})],Y.prototype,"disabled",void 0);oe([d({type:Boolean})],Y.prototype,"rightIcon",void 0);oe([d({type:Boolean})],Y.prototype,"rounded",void 0);oe([d({type:Boolean})],Y.prototype,"fullSize",void 0);Y=oe([O("wui-list-item")],Y);var gr=function(e,t,i,r){var o=arguments.length,n=o<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(e,t,i,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(o<3?s(n):o>3?s(t,i,n):s(t,i))||n);return o>3&&n&&Object.defineProperty(t,i,n),n};let An=class extends M{constructor(){super(...arguments),this.wallet=P.state.data?.wallet}render(){if(!this.wallet)throw new Error("w3m-downloads-view");return u`
      <wui-flex gap="2" flexDirection="column" .padding=${["3","3","4","3"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){return this.wallet?.chrome_store?u`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){return this.wallet?.app_store?u`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){return this.wallet?.play_store?u`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){return this.wallet?.homepage?u`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="md-medium" color="primary">Website</wui-text>
      </wui-list-item>
    `:null}openStore(t){t.href&&this.wallet&&(F.sendEvent({type:"track",event:"GET_WALLET",properties:{name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.wallet.id,type:t.type}}),B.openHref(t.href,"_blank"))}onChromeStore(){this.wallet?.chrome_store&&this.openStore({href:this.wallet.chrome_store,type:"chrome_store"})}onAppStore(){this.wallet?.app_store&&this.openStore({href:this.wallet.app_store,type:"app_store"})}onPlayStore(){this.wallet?.play_store&&this.openStore({href:this.wallet.play_store,type:"play_store"})}onHomePage(){this.wallet?.homepage&&this.openStore({href:this.wallet.homepage,type:"homepage"})}};An=gr([O("w3m-downloads-view")],An);export{rt as W3mAllWalletsView,Ze as W3mConnectingWcBasicView,An as W3mDownloadsView};
