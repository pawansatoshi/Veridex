#include <stdint.h>
#include <stddef.h>

typedef enum { ST_UNKNOWN=0, ST_FALSE=1, ST_TRUE=2, ST_INVALID=3 } state_t;
typedef struct { state_t ownership, upgradeability, pause, mint; int present, invalid, evidence, conclusive; } report_t;

/* 128 KiB scratch heap. The linker exports linear memory separately. */
static uint8_t heap[131072];
static uint32_t hp = 0;

static size_t slen(const char *s){ size_t n=0; while(s[n]) n++; return n; }
static int smemcmp(const char *a,const char *b,size_t n){ for(size_t i=0;i<n;i++){ if(a[i]!=b[i]) return (unsigned char)a[i]-(unsigned char)b[i]; } return 0; }
static int is_ws(char c){ return c==' '||c=='\n'||c=='\r'||c=='\t'; }
static int lower(char c){ return c>='A'&&c<='Z' ? c+32 : c; }
static int eq_ci(const char *a,size_t n,const char *b){ size_t m=slen(b); if(n!=m)return 0; for(size_t i=0;i<n;i++)if(lower(a[i])!=lower(b[i]))return 0; return 1; }
static const char *skip_ws(const char *p,const char *e){ while(p<e&&is_ws(*p))p++; return p; }

/* We intentionally reject duplicate capability keys. This prevents a miner from
   hiding one answer behind another duplicate JSON key. */
static int count_key(const char *s,size_t n,const char *key){
  size_t k=slen(key),c=0; if(!k||n<k+2)return 0;
  for(size_t i=0;i+k+2<=n;i++) if(s[i]=='"'&&smemcmp(s+i+1,key,k)==0&&s[i+1+k]=='"') c++;
  return (int)c;
}
static const char *find_key(const char *s,size_t n,const char *key){
  size_t k=slen(key); if(k==0||n<k+2)return 0;
  for(size_t i=0;i+k+2<=n;i++) if(s[i]=='"'&&smemcmp(s+i+1,key,k)==0&&s[i+1+k]=='"'){
    const char *p=s+i+k+2,*e=s+n; p=skip_ws(p,e); if(p<e&&*p==':') return skip_ws(p+1,e);
  }
  return 0;
}
static state_t value_state(const char *p,const char *e){
  if(!p||p>=e)return ST_INVALID;
  if((size_t)(e-p)>=4&&smemcmp(p,"true",4)==0)return ST_TRUE;
  if((size_t)(e-p)>=5&&smemcmp(p,"false",5)==0)return ST_FALSE;
  if((size_t)(e-p)>=7&&smemcmp(p,"unknown",7)==0)return ST_UNKNOWN;
  if(*p=='"'){
    const char *q=p+1; while(q<e&&*q!='"')q++; if(q>=e)return ST_INVALID;
    size_t n=(size_t)(q-(p+1));
    if(eq_ci(p+1,n,"true")||eq_ci(p+1,n,"yes")||eq_ci(p+1,n,"active")||eq_ci(p+1,n,"detected")||eq_ci(p+1,n,"present")||eq_ci(p+1,n,"enabled"))return ST_TRUE;
    if(eq_ci(p+1,n,"false")||eq_ci(p+1,n,"no")||eq_ci(p+1,n,"inactive")||eq_ci(p+1,n,"not detected")||eq_ci(p+1,n,"absent")||eq_ci(p+1,n,"disabled"))return ST_FALSE;
    if(eq_ci(p+1,n,"unknown")||eq_ci(p+1,n,"inconclusive")||eq_ci(p+1,n,"unavailable"))return ST_UNKNOWN;
    return ST_INVALID;
  }
  return ST_INVALID;
}
static void init(report_t*r){r->ownership=r->upgradeability=r->pause=r->mint=ST_UNKNOWN;r->present=0;r->invalid=0;r->evidence=0;r->conclusive=0;}
static state_t getcap(const char*s,size_t n,const char*k,int*pres,int*inv){
  int cnt=count_key(s,n,k); if(cnt>1){*pres=1;*inv=1;return ST_INVALID;}
  const char*p=find_key(s,n,k); if(!p)return ST_UNKNOWN; *pres=1; state_t st=value_state(p,s+n); if(st==ST_INVALID)*inv=1; return st;
}
static int has_word(const char*s,size_t n,const char*w){
  size_t k=slen(w); if(!k||n<k)return 0;
  for(size_t i=0;i+k<=n;i++){size_t j=0;for(;j<k;j++)if(lower(s[i+j])!=lower(w[j]))break;if(j==k)return 1;} return 0;
}
static void parse_report(const char*s,size_t n,report_t*r){
  init(r); int p=0,inv=0;
  p=inv=0;r->ownership=getcap(s,n,"ownership",&p,&inv);r->present+=p;r->invalid|=inv;
  p=inv=0;r->upgradeability=getcap(s,n,"upgradeability",&p,&inv);r->present+=p;r->invalid|=inv;
  p=inv=0;r->pause=getcap(s,n,"pause",&p,&inv);r->present+=p;r->invalid|=inv;
  p=inv=0;r->mint=getcap(s,n,"mint",&p,&inv);r->present+=p;r->invalid|=inv;
  if(has_word(s,n,"evidence")||has_word(s,n,"evidence_refs")||has_word(s,n,"evidenceRefs"))r->evidence=1;
  if(has_word(s,n,"conclusive")||has_word(s,n,"conclusive_state")||has_word(s,n,"conclusiveState"))r->conclusive=1;
}
static float pair_score(state_t a,state_t b){ if(a==ST_INVALID||b==ST_INVALID)return 0.0f; return a==b?1.0f:0.0f; }

__attribute__((export_name("alloc"))) uint32_t alloc(uint32_t n){
  if(n==0)return 0; uint32_t aligned=(n+7u)&~7u; if(aligned>sizeof(heap)-hp)return 0; uint32_t p=(uint32_t)(uintptr_t)(heap+hp); hp+=aligned; return p;
}
__attribute__((export_name("dealloc"))) void dealloc(uint32_t p,uint32_t n){
  (void)n; uint32_t base=(uint32_t)(uintptr_t)heap; if(p>=base&&p<base+hp)hp=p-base;
}

__attribute__((export_name("rank_answer"))) float rank_answer(uint32_t qptr,uint32_t qlen,uint32_t gtptr,uint32_t gtlen,uint32_t aptr,uint32_t alen){
  (void)qptr;(void)qlen;
  const char*gt=(const char*)(uintptr_t)gtptr,*ans=(const char*)(uintptr_t)aptr; report_t g,a; parse_report(gt,gtlen,&g);parse_report(ans,alen,&a);
  if(g.invalid||a.invalid)return 0.0f;
  const float w[4]={0.30f,0.30f,0.20f,0.20f}; state_t gs[4]={g.ownership,g.upgradeability,g.pause,g.mint}; state_t as[4]={a.ownership,a.upgradeability,a.pause,a.mint};
  float total=0.0f,weight=0.0f; int missing=0,known=0;
  for(int i=0;i<4;i++)if(gs[i]!=ST_UNKNOWN){known++;weight+=w[i];total+=w[i]*pair_score(gs[i],as[i]);if(as[i]==ST_UNKNOWN)missing++;}
  if(weight<=0.0f)return 0.0f; float score=total/weight;
  if(known>0)score*=1.0f-0.08f*((float)missing/(float)known);
  if(score>0.0f&&g.evidence&&a.evidence)score+=0.02f;
  if(score>0.0f&&g.conclusive&&a.conclusive)score+=0.02f;
  return score>1.0f?1.0f:score;
}

/* Optional diagnostic export. The protocol's canonical score remains rank_answer. */
__attribute__((export_name("breakdown_answer"))) uint32_t breakdown_answer(uint32_t qptr,uint32_t qlen,uint32_t gtptr,uint32_t gtlen,uint32_t aptr,uint32_t alen,uint32_t outptr,uint32_t outcap){
  (void)qptr;(void)qlen;(void)gtptr;(void)gtlen;(void)aptr;(void)alen;(void)outptr;(void)outcap;return 0;
}
