#include <stdint.h>

/* Veridex Track 2 scorer v4
   Freestanding wasm32; deterministic, bounded-memory, intent-aware.
   Scores answer relevance/correctness rather than raw string similarity. */

#define HEAP_SIZE 1048576u
#define HEAP_BASE 65536u
static uint8_t heap[HEAP_SIZE];
static uint32_t heap_top = HEAP_BASE;
static float bd[5];

typedef struct { uint32_t h; uint16_t len; uint16_t st; } Tok;

typedef struct { uint32_t h; uint8_t group; uint8_t neg; uint8_t seen; uint8_t pad; } Sig;

static uint8_t lo(uint8_t c){ return (c>='A'&&c<='Z')?(uint8_t)(c+32):c; }
static int wordc(uint8_t c){ return ((c>='A'&&c<='Z')||(c>='a'&&c<='z')||(c>='0'&&c<='9')||c=='_'||c=='-'||c>=128); }
static int spacec(uint8_t c){ return c==' '||c=='\n'||c=='\r'||c=='\t'; }
static int stop_h(uint32_t h){ (void)h; return 0; }
static uint32_t hash_word(const uint8_t *p,int n){ uint32_t h=2166136261u; for(int i=0;i<n;i++){h^=lo(p[i]); h*=16777619u;} return h; }
static int eqs(const uint8_t *p,int n,const char *s){ int i=0; while(i<n&&s[i]){if(lo(p[i])!=(uint8_t)s[i])return 0;i++;} return i==n&&s[i]=='\0'; }
static int group_word(const uint8_t *p,int n){
    static const char *const g1[]={"fraud","fraudulent","scam","phishing","phish","malicious","malware","fake","counterfeit","deceptive","deception","unsafe","dangerous","harmful","attack","attacker","compromised","stolen"};
    static const char *const g2[]={"safe","legitimate","legit","genuine","authentic","benign","trusted","trustworthy","secure","harmless","clean","verified"};
    static const char *const g3[]={"positive","bullish","optimistic","favorable","favourable","upbeat"};
    static const char *const g4[]={"negative","bearish","pessimistic","unfavorable","unfavourable","downbeat"};
    static const char *const g5[]={"yes","true","correct","valid","confirmed","approved","approve"};
    static const char *const g6[]={"no","false","incorrect","invalid","denied","rejected","reject"};
    static const char *const g7[]={"allowed","permitted","acceptable","okay","ok"};
    static const char *const g8[]={"blocked","forbidden","prohibited","disallowed"};
    static const char *const g9[]={"reduce","reduced","reduces","reducing","decrease","decreased","decreases","decreasing","lower","lowered","lowers","lowering","fall","fell","falls","falling","drop","dropped","drops","dropping","cut","cutting"};
    static const char *const g10[]={"increase","increased","increases","increasing","raise","raised","raises","raising","higher","rise","rose","rises","rising","grow","grew","grows","growing","boost","boosted","boosts"};
    const char *const*gs[]={g1,g2,g3,g4,g5,g6,g7,g8,g9,g10};
    const uint8_t cs[]={18,12,6,6,7,7,5,4,22,20};
    for(int g=0;g<10;g++) for(int i=0;i<cs[g];i++) if(eqs(p,n,gs[g][i])) return g+1;
    return 0;
}
static int is_neg(const uint8_t *p,int n){ return eqs(p,n,"not")||eqs(p,n,"no")||eqs(p,n,"never")||eqs(p,n,"isn't")||eqs(p,n,"isnt")||eqs(p,n,"wasn't")||eqs(p,n,"wasnt"); }

static int tokenize(const uint8_t *s,int n,Tok *out,int cap){
    int p=0,c=0;
    while(p<n && c<cap){
        while(p<n && !wordc(s[p])) p++;
        if(p>=n) break;
        int st=p; while(p<n && wordc(s[p])) p++;
        int len=p-st; if(len<=0) continue;
        uint32_t h=hash_word(s+st,len);
        if(!stop_h(h)) { out[c].h=h; out[c].len=(uint16_t)(len>65535?65535:len); out[c].st=(uint16_t)(st>65535?65535:st); c++; }
    }
    return c;
}

static int exact_norm(const uint8_t *a,int an,const uint8_t *b,int bn){
    int i=0,j=0,ca=0,cb=0;
    while(i<an){ while(i<an&&!wordc(a[i]))i++; while(i<an&&wordc(a[i])){ca++;i++;} }
    while(j<bn){ while(j<bn&&!wordc(b[j]))j++; while(j<bn&&wordc(b[j])){cb++;j++;} }
    if(ca!=cb||ca==0)return 0;
    Tok ta[256],tb[256]; int na=tokenize(a,an,ta,256), nb=tokenize(b,bn,tb,256); if(na!=nb)return 0;
    for(int k=0;k<na;k++) if(ta[k].h!=tb[k].h)return 0;
    return 1;
}

static int has_h(Tok *t,int n,uint32_t h){ for(int i=0;i<n;i++) if(t[i].h==h)return 1; return 0; }
static int count_group(const uint8_t *s,int n,int group){
    int p=0,c=0; while(p<n){ while(p<n&&!wordc(s[p]))p++; if(p>=n)break; int st=p; while(p<n&&wordc(s[p]))p++; if(group_word(s+st,p-st)==group)c++; } return c;
}
static int has_group(const uint8_t *s,int n,int group){ return count_group(s,n,group)>0; }
static int has_token(const uint8_t *s,int n,uint32_t h){
    int p=0; while(p<n){ while(p<n&&!wordc(s[p]))p++; if(p>=n)break; int st=p; while(p<n&&wordc(s[p]))p++; if(hash_word(s+st,p-st)==h)return 1; } return 0;
}
static int contradiction(const uint8_t *gt,int gn,const uint8_t *ans,int an){
    int pg[10]={0},pa[10]={0}; int p=0,s=0,l=0;
    while(next_token(gt,gn,&p,&s,&l)){}
    p=0;while(next_token(ans,an,&p,&s,&l)){}
    p=0;while(p<gn){while(p<gn&&!wordc(gt[p]))p++;if(p>=gn)break;int st=p;while(p<gn&&wordc(gt[p]))p++;int g=group_word(gt+st,p-st);if(g)pg[g-1]=1;}
    p=0;while(p<an){while(p<an&&!wordc(ans[p]))p++;if(p>=an)break;int st=p;while(p<an&&wordc(ans[p]))p++;int g=group_word(ans+st,p-st);if(g)pa[g-1]=1;}
    static const int opp[][2]={{1,2},{3,4},{5,6},{7,8},{9,10}};
    for(int i=0;i<5;i++)if((pg[opp[i][0]-1]&&pa[opp[i][1]-1])||(pg[opp[i][1]-1]&&pa[opp[i][0]-1]))return 1; return 0;
}
static int negated(const uint8_t *gt,int gn,const uint8_t *ans,int an){
    if(contradiction(gt,gn,ans,an))return 1; int p=0; while(p<an){while(p<an&&!wordc(ans[p]))p++;if(p>=an)break;int st=p;while(p<an&&wordc(ans[p]))p++;if(is_neg(ans+st,p-st))return 1;} return 0;
}
static int next_token(const uint8_t *s,int n,int *pos,int *st,int *len){int i=*pos;while(i<n&&!wordc(s[i]))i++;if(i>=n){*pos=i;return 0;}*st=i;while(i<n&&wordc(s[i]))i++;*len=i-*st;*pos=i;return 1;}
static float lexical_overlap(const uint8_t *gt,int gn,const uint8_t *ans,int an,float *prec,float *rec){
    Tok a[256],b[256]; int na=tokenize(gt,gn,a,256),nb=tokenize(ans,an,b,256),common=0; for(int i=0;i<na;i++)if(has_h(b,nb,a[i].h))common++;
    *rec=na?(float)common/(float)na:0.0f; *prec=nb?(float)common/(float)nb:0.0f; return (*prec+*rec)>0?2.0f*(*prec)*(*rec)/(*prec+*rec):0.0f;
}
static int number_values(const uint8_t *s,int n,int *vals,int cap){int p=0,c=0;while(p<n&&c<cap){while(p<n&&!((s[p]>='0'&&s[p]<='9')||s[p]=='.'))p++;if(p>=n)break;int v=0,got=0;while(p<n&&s[p]>='0'&&s[p]<='9'){v=v*10+(s[p]-'0');if(v>1000000000)v=1000000000;p++;got=1;}if(got)vals[c++]=v;else p++;}return c;}
static int numeric_match(const uint8_t *gt,int gn,const uint8_t *ans,int an){int a[8],b[8];int na=number_values(gt,gn,a,8),nb=number_values(ans,an,b,8);if(na==0||nb==0||na!=nb)return 0;for(int i=0;i<na;i++)if(a[i]!=b[i])return 0;return 1;}
static int entity_mismatch(const uint8_t *q,int qn,const uint8_t *gt,int gn,const uint8_t *ans,int an){int p=0;while(p<an){while(p<an&&!wordc(ans[p]))p++;if(p>=an)break;int st=p;while(p<an&&wordc(ans[p]))p++;int len=p-st;if(len>=2&&ans[st]>='A'&&ans[st]<='Z'){uint32_t h=hash_word(ans+st,len);if(!has_token(gt,gn,h)&&!has_token(q,qn,h))return 1;}}return 0;}
static float score_text(const uint8_t *q,int qn,const uint8_t *gt,int gn,const uint8_t *ans,int an){
    if(gn<=0||an<=0)return 0.0f; if(exact_norm(gt,gn,ans,an))return 1.0f;
    float pre=0,rec=0,f1=lexical_overlap(gt,gn,ans,an,&pre,&rec);int semantic_hits=0,semantic_total=0;
    for(int g=1;g<=10;g++)if(has_group(gt,gn,g)){semantic_total++;if(has_group(ans,an,g))semantic_hits;}
    float sem=semantic_total?(float)semantic_hits/(float)semantic_total:0.0f;float len=(float)(gn<an?gn:an)/(float)(gn>an?gn:an);float score=0.55f*f1+0.35f*sem+0.10f*len;
    if(semantic_total>0&&semantic_hits>0)score+=0.10f;if(numeric_match(gt,gn,ans,an))score+=0.10f;if(entity_mismatch(q,qn,gt,gn,ans,an))score*=0.20f;if(negated(gt,gn,ans,an))score*=0.10f;
    if(score>0.999f)score=0.999f;if(score<0)score=0;return score;
}
__attribute__((export_name("alloc"))) uint32_t alloc(uint32_t size){if(size==0)return 0;uint32_t p=(heap_top+7u)&~7u;if(p>HEAP_SIZE||size>HEAP_SIZE-p)return 0;heap_top=p+size;return p;}
__attribute__((export_name("dealloc"))) void dealloc(uint32_t ptr,uint32_t size){if(size==0)return;if(ptr>=HEAP_BASE&&ptr+size==heap_top)heap_top=ptr;}
__attribute__((export_name("rank_answer"))) float rank_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ans_ptr,uint32_t ans_len){return score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ans_ptr,(int)ans_len);}
__attribute__((export_name("breakdown_answer"))) uint32_t breakdown_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ans_ptr,uint32_t ans_len){float s=score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ans_ptr,(int)ans_len);bd[0]=s;bd[1]=s;bd[2]=s;bd[3]=(gt_len&&ans_len)?((float)(gt_len<ans_len?gt_len:ans_len)/(float)(gt_len>ans_len?gt_len:ans_len)):0.0f;bd[4]=s;return (uint32_t)(uintptr_t)bd;}
