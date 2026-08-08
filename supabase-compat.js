
(function(){
  const URL='https://umaotmgjvzkvsvnsavdu.supabase.co';
  const KEY='sb_publishable_n7qbS_7kArsjDDilGkSvqQ_zl40jlkd';
  const sb=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.nadineSupabase=sb;

  const SERVER={__server:true}, DEL={__delete:true};
  const clean=v=>{
    if(v===SERVER)return new Date().toISOString();
    if(v===DEL)return DEL;
    if(Array.isArray(v))return v.map(clean);
    if(v&&typeof v==='object'){
      const o={}; for(const [k,x] of Object.entries(v)){const y=clean(x);if(y!==DEL)o[k]=y} return o;
    } return v;
  };
  class SnapDoc{
    constructor(row){this._row=row;this.id=row?.doc_id||'';this.exists=!!row}
    data(){return this._row?this._row.data:null}
  }
  class SnapQuery{
    constructor(rows){this.docs=(rows||[]).map(r=>new SnapDoc(r));this.size=this.docs.length;this.empty=!this.docs.length}
  }
  const normalizeUser=u=>u?{
    uid:u.id,email:u.email||'',displayName:u.user_metadata?.display_name||u.user_metadata?.full_name||'',
    metadata:{creationTime:u.created_at},
    updateProfile:async data=>{const metadata={};if('displayName'in data)metadata.display_name=data.displayName;const {error}=await sb.auth.updateUser({data:metadata});if(error)throw error}
  }:null;

  class DocRef{
    constructor(col,id){this.col=col;this.id=id||crypto.randomUUID()}
    async get(){const {data,error}=await sb.from('app_documents').select('*').eq('collection_name',this.col).eq('doc_id',this.id).maybeSingle();if(error)throw error;return new SnapDoc(data)}
    async set(data,opt={}){
      let next=clean(data);
      if(opt.merge){const old=await this.get();next={...(old.exists?old.data():{}),...next}}
      const {error}=await sb.from('app_documents').upsert({collection_name:this.col,doc_id:this.id,data:next,updated_at:new Date().toISOString()},{onConflict:'collection_name,doc_id'});if(error)throw error;return this
    }
    async update(data){const old=await this.get();if(!old.exists)throw new Error('Document not found');return this.set({...old.data(),...clean(data)})}
    async delete(){const {error}=await sb.from('app_documents').delete().eq('collection_name',this.col).eq('doc_id',this.id);if(error)throw error}
    onSnapshot(optionsOrOk,okOrFail,maybeFail){
      const ok=typeof optionsOrOk==='function'?optionsOrOk:okOrFail;
      const fail=typeof optionsOrOk==='function'?okOrFail:maybeFail;
      let alive=true;
      const load=()=>this.get().then(x=>{
        x.metadata={fromCache:false};
        if(alive&&typeof ok==='function')ok(x);
      }).catch(e=>{if(typeof fail==='function')fail(e)});
      load();
      const ch=sb.channel('doc-'+this.col+'-'+this.id+'-'+Math.random())
        .on('postgres_changes',
          {event:'*',schema:'public',table:'app_documents',filter:`collection_name=eq.${this.col}`},
          p=>{if((p.new?.doc_id||p.old?.doc_id)===this.id)load()}
        ).subscribe();
      return()=>{alive=false;sb.removeChannel(ch)}
    }
  }
  class Query{
    constructor(col,filters=[],ord=null,lim=null){this.col=col;this.filters=filters;this.ord=ord;this.lim=lim}
    where(k,op,v){return new Query(this.col,[...this.filters,[k,op,v]],this.ord,this.lim)}
    orderBy(k,dir='asc'){return new Query(this.col,this.filters,[k,dir],this.lim)}
    limit(n){return new Query(this.col,this.filters,this.ord,n)}
    async get(){
      // Supabase/PostgREST returns at most 1,000 rows per request by default.
      // Fetch the collection page-by-page so large SoftPharm catalogs (16k+)
      // are fully loaded, then apply the Firebase-style filters/sort/limit locally.
      const rows=[];
      const pageSize=1000;
      let from=0;

      while(true){
        const to=from+pageSize-1;
        const {data,error}=await sb
          .from('app_documents')
          .select('*')
          .eq('collection_name',this.col)
          .range(from,to);

        if(error)throw error;

        const page=data||[];
        rows.push(...page);

        if(page.length<pageSize)break;
        from+=pageSize;

        // Yield occasionally so a 16k+ catalog does not lock the browser.
        if(from%5000===0)await new Promise(resolve=>setTimeout(resolve,0));
      }

      let filtered=rows;
      for(const [k,op,v] of this.filters){
        filtered=filtered.filter(r=>op==='=='?r.data?.[k]===v:true);
      }

      if(this.ord){
        const [k,d]=this.ord;
        filtered.sort((a,b)=>{
          const av=a.data?.[k],bv=b.data?.[k];
          return(d==='desc'?-1:1)*((av>bv)-(av<bv));
        });
      }

      if(this.lim!=null)filtered=filtered.slice(0,this.lim);
      return new SnapQuery(filtered);
    }
    onSnapshot(optionsOrOk,okOrFail,maybeFail){
      const ok=typeof optionsOrOk==='function'?optionsOrOk:okOrFail;
      const fail=typeof optionsOrOk==='function'?okOrFail:maybeFail;
      let alive=true,timer=null;
      const load=()=>this.get().then(x=>{
        // Firebase snapshots expose metadata.fromCache. Supabase queries here are server-backed.
        x.metadata={fromCache:false};
        if(alive&&typeof ok==='function')ok(x);
      }).catch(e=>{if(typeof fail==='function')fail(e)});
      load();
      const ch=sb.channel('col-'+this.col+'-'+Math.random())
        .on('postgres_changes',
          {event:'*',schema:'public',table:'app_documents',filter:`collection_name=eq.${this.col}`},
          ()=>{clearTimeout(timer);timer=setTimeout(load,50)}
        ).subscribe();
      return()=>{alive=false;clearTimeout(timer);sb.removeChannel(ch)}
    }
  }
  class Collection extends Query{
    constructor(name){super(name);this.name=name}
    doc(id){return new DocRef(this.name,id)}
    async add(data){const r=this.doc();await r.set(data);return r}
  }
  const db={
    collection:n=>new Collection(n),
    batch:()=>{const ops=[];return{
      set:(r,d,o)=>ops.push(()=>r.set(d,o)),update:(r,d)=>ops.push(()=>r.update(d)),delete:r=>ops.push(()=>r.delete()),
      commit:async()=>{for(let i=0;i<ops.length;i+=50)await Promise.all(ops.slice(i,i+50).map(f=>f()))}
    }}
  };
  const auth={
    currentUser:null,
    Auth:{Persistence:{LOCAL:'local'}},
    EmailAuthProvider:{credential:(email,password)=>({email,password})},
    GoogleAuthProvider:function(){},
    setPersistence:async()=>{},
    signInWithEmailAndPassword:async(email,password)=>{const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;auth.currentUser=normalizeUser(data.user);return{user:auth.currentUser}},
    createUserWithEmailAndPassword:async(email,password)=>{const {data,error}=await sb.auth.signUp({email,password});if(error)throw error;auth.currentUser=normalizeUser(data.user);return{user:auth.currentUser}},
    signOut:async()=>{const {error}=await sb.auth.signOut();if(error)throw error;auth.currentUser=null},
    sendPasswordResetEmail:async email=>{const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error},
    signInWithPopup:async()=>{
      const redirectTo=location.origin+'/';
      const {data,error}=await sb.auth.signInWithOAuth({
        provider:'google',
        options:{redirectTo,skipBrowserRedirect:true}
      });
      if(error)throw error;
      if(!data?.url)throw new Error('Google sign-in URL was not returned by Supabase.');
      window.location.assign(data.url);
      // Keep this promise pending so the old Firebase-style caller does not
      // immediately close the sign-in modal before navigation begins.
      return new Promise(()=>{});
    },
    onAuthStateChanged:cb=>{
      let active=true;
      let lastUid='__unset__';

      const emit=session=>{
        if(!active)return;
        const user=normalizeUser(session?.user||null);
        const uid=user?.uid||'';
        // Do not emit the same auth state twice. This prevents the OAuth return
        // sequence from briefly flipping a valid logged-in user back to null.
        if(uid===lastUid)return;
        lastUid=uid;
        auth.currentUser=user;
        cb(user);
      };

      const {data:listener}=sb.auth.onAuthStateChange(async(event,session)=>{
        if(event==='SIGNED_OUT'){
          emit(null);
          return;
        }
        if(session?.user){
          emit(session);
          return;
        }
        // INITIAL_SESSION can transiently be empty while the OAuth code exchange
        // is still completing. Confirm with getSession before treating it as logout.
        try{
          const {data}=await sb.auth.getSession();
          if(data?.session?.user)emit(data.session);
          else emit(null);
        }catch(e){
          emit(null);
        }
      });

      // Resolve the already-restored session once on startup.
      sb.auth.getSession().then(({data})=>{
        if(data?.session?.user)emit(data.session);
        else emit(null);
      }).catch(()=>emit(null));

      return()=>{active=false;listener.subscription.unsubscribe()}
    }
  };
  window.firebase={
    apps:[{}],initializeApp:()=>({}),auth:()=>auth,firestore:()=>db,
    functions:()=>({httpsCallable:()=>async()=>({data:{ok:true}})})
  };
  window.firebase.auth.Auth=auth.Auth;
  window.firebase.auth.EmailAuthProvider=auth.EmailAuthProvider;
  window.firebase.auth.GoogleAuthProvider=auth.GoogleAuthProvider;
  window.firebase.firestore.FieldValue={serverTimestamp:()=>SERVER,delete:()=>DEL};
})();
