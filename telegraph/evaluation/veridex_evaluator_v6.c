#include <stdint.h>
#define HEAP_SIZE 2097152u
#define HEAP_BASE 65536u
#define MAX_TOKENS 512
#define MAX_NUMBERS 16
#define MAX_ENTITIES 32
static uint8_t heap[HEAP_SIZE]; static uint32_t heap_top=HEAP_BASE; static float bd[5];
typedef struct {uint32_t h; int st; int len;} Tok;
static uint8_t lo(uint8_t c){return c>='A'&&c<='Z'?(uint8_t)(c+32):c;}
static int digit(uint8_t c){return c>='0'&&c<='9';}
static int word(uint8_t c){return (c>='A'&&c<='Z')||(c>='a'&&c<='z')||digit(c)||c=='_'||c=='-'||c>=128;}
static int space(uint8_t c){return c==' '||c=='\n'||c=='\r'||c=='\t'||c=='\f'||c=='\v';}
static int eq(const uint8_t*p,int n,const char*s){int i=0;while(i<n&&s[i]){if(lo(p[i])!=(uint8_t)s[i])return 0;i++;}return i==n&&s[i]=='\0';}
static int stop(const uint8_t*p,int n){static const char*sw[]={"a","an","and","are","as","at","be","been","by","can","could","did","do","does","for","from","had","has","have","how","i","if","in","is","it","its","may","might","of","on","or","our","that","the","their","this","to","was","we","were","what","when","where","which","who","why","will","with","would","you","your"};for(unsigned i=0;i<sizeof(sw)/sizeof(sw[0]);i++)if(eq(p,n,sw[i]))return 1;return 0;}
static uint32_t hword(const uint8_t*p,int n){uint32_t h=2166136261u;for(int i=0;i<n;i++){h^=lo(p[i]);h*=16777619u;}return h;}
static int toks(const uint8_t*s,int n,Tok*out,int cap){int p=0,c=0;while(p<n&&c<cap){while(p<n&&!word(s[p]))p++;if(p>=n)break;int st=p;while(p<n&&word(s[p]))p++;int l=p-st;if(l&&!stop(s+st,l)){out[c].h=hword(s+st,l);out[c].st=st;out[c].len=l;c++;}}return c;}
static int has(const Tok*t,int n,uint32_t h){for(int i=0;i<n;i++)if(t[i].h==h)return 1;return 0;}
static int group(const uint8_t*p,int n){
static const char*const G[][24]={{"fraud","fraudulent","scam","phishing","phish","malicious","malware","fake","counterfeit","deceptive","deception","unsafe","dangerous","harmful","attack","attacker","compromised","stolen","ponzi"},{"safe","legitimate","legit","genuine","authentic","benign","trusted","trustworthy","secure","harmless","clean"},{"positive","bullish","optimistic","favorable","favourable","upbeat"},{"negative","bearish","pessimistic","unfavorable","unfavourable","downbeat"},{"yes","true","correct","valid","confirmed","approved","approve"},{"no","false","incorrect","invalid","denied","rejected","reject"},{"allowed","permitted","acceptable","okay","ok"},{"blocked","forbidden","prohibited","disallowed"},{"reduce","reduced","reduces","reducing","decrease","decreased","decreases","decreasing","lower","lowered","lowers","lowering","fall","fell","falls","falling","drop","dropped","drops","dropping","cut","cutting"},{"increase","increased","increases","increasing","raise","raised","raises","raising","higher","rise","rose","rises","rising","grow","grew","grows","growing","boost","boosted","boosts"}};
static const uint8_t C[]={19,11,6,6,7,7,5,4,22,20};
for(int g=0;g<10;g++)for(int i=0;i<C[g];i++)if(eq(p,n,G[g][i]))return g+1;return 0;}
static int contradictory(const Tok*g,int gn,const Tok*a,int an,const uint8_t*gt,const uint8_t*ans){static const int opp[][2]={{1,2},{3,4},{5,6},{7,8},{9,10}};for(int k=0;k<5;k++){int g1=0,g2=0,a1=0,a2=0;for(int i=0;i<gn;i++){int gg=group(gt+g[i].st,g[i].len);if(gg==opp[k][0])g1=1;if(gg==opp[k][1])g2=1;}for(int i=0;i<an;i++){int gg=group(ans+a[i].st,a[i].len);if(gg==opp[k][0])a1=1;if(gg==opp[k][1])a2=1;}if((g1&&a2)||(g2&&a1))return 1;}return 0;}
static int numeric(const uint8_t*s,int n,double*v,int*pct,int cap){int p=0,c=0;while(p<n&&c<cap){while(p<n&&!digit(s[p])&&s[p]!='.')p++;if(p>=n)break;double x=0.0;int any=0,dot=0;double place=.1;while(p<n){uint8_t ch=s[p];if(digit(ch)){if(!dot)x=x*10+(ch-'0');else{x+=(ch-'0')*place;place*=.1;}any=1;p++;continue;}if(ch==','||ch=='_'){p++;continue;}if(ch=='.'&&!dot){dot=1;p++;continue;}break;}if(!any){p++;continue;}while(p<n&&space(s[p]))p++;if(p<n&&(s[p]=='k'||s[p]=='K')){x*=1000;p++;}else if(p<n&&(s[p]=='m'||s[p]=='M')){x*=1000000;p++;}else if(p<n&&(s[p]=='b'||s[p]=='B')){x*=1000000000;p++;}pct[c]=(p<n&&s[p]=='%');if(pct[c])p++;v[c++]=x;}return c;}
static int numeric_quality(const uint8_t*gt,int gn,const uint8_t*ans,int an){double a[MAX_NUMBERS],b[MAX_NUMBERS];int ap[MAX_NUMBERS],bp[MAX_NUMBERS];int na=numeric(gt,gn,a,ap,MAX_NUMBERS),nb=numeric(ans,an,b,bp,MAX_NUMBERS);if(na==0&&nb==0)return 0;if(na==0||nb==0||na!=nb)return -1;for(int i=0;i<na;i++){double s=a[i]>b[i]?a[i]:b[i];if(s<1)s=1;double d=a[i]>b[i]?a[i]-b[i]:b[i]-a[i];if(ap[i]!=bp[i]||d>s*.001+1e-6)return -1;}return 1;}
static int likely_entity(const uint8_t*s,const Tok*t){int st=t->st;if(s[st]<'A'||s[st]>'Z')return 0;if(eq(s+st,t->len,"The")||eq(s+st,t->len,"This")||eq(s+st,t->len,"What")||eq(s+st,t->len,"Which")||eq(s+st,t->len,"Is")||eq(s+st,t->len,"How")||eq(s+st,t->len,"Q"))return 0;return t->len>=2;}
static int entity_conflict(const Tok*gt,int gn,const uint8_t*gts,const Tok*ans,int an,const uint8_t*anss){uint32_t e[MAX_ENTITIES];int en=0;for(int i=0;i<gn&&en<MAX_ENTITIES;i++)if(likely_entity(gts,&gt[i]))e[en++]=gt[i].h;if(en==0)return 0;for(int i=0;i<an;i++)if(likely_entity(anss,&ans[i])){int ok=0;for(int j=0;j<en;j++)if(e[j]==ans[i].h){ok=1;break;}if(!ok)return 1;}return 0;}
static int any_nonspace(const uint8_t*s,int n){for(int i=0;i<n;i++)if(!space(s[i]))return 1;return 0;}
static float score_text(const uint8_t*q,int qn,const uint8_t*gt,int gn,const uint8_t*ans,int an){
    if(gn<=0||an<=0||!any_nonspace(ans,an))return 0.0f;
    Tok g[MAX_TOKENS],a[MAX_TOKENS],qt[MAX_TOKENS];int ng=toks(gt,gn,g,MAX_TOKENS),na=toks(ans,an,a,MAX_TOKENS),nq=toks(q,qn,qt,MAX_TOKENS);if(ng<=0||na<=0)return 0.0f;
    int exact=1;if(ng!=na)exact=0;else for(int i=0;i<ng;i++)if(g[i].h!=a[i].h){exact=0;break;}if(exact)return 1.0f;
    int common=0,semc=0,big=0,bign=ng>1?ng-1:0;
    for(int i=0;i<ng;i++){if(has(a,na,g[i].h))common++;int gg=group(gt+g[i].st,g[i].len);if(gg&&has(a,na,g[i].h)){semc++;continue;}if(gg)for(int j=0;j<na;j++)if(group(ans+a[j].st,a[j].len)==gg){semc++;break;}}
    for(int i=0;i<bign;i++)for(int j=0;j<na-1;j++)if(g[i].h==a[j].h&&g[i+1].h==a[j+1].h){big++;break;}
    float prec=(float)common/(float)na,rec=(float)common/(float)ng,sem=(float)semc/(float)ng,bigr=bign?(float)big/(float)bign:0.0f,len=(float)(gn<an?gn:an)/(float)(gn>an?gn:an);
    (void)nq;
    float score=.42f*sem+.24f*prec+.14f*rec+.10f*bigr+.10f*len;
    if(semc>0&&sem>=.5f)score+=.12f;
    int nqv=numeric_quality(gt,gn,ans,an);if(nqv==1)score+=.16f;else if(nqv<0){double xa[MAX_NUMBERS],xb[MAX_NUMBERS];int pa[MAX_NUMBERS],pb[MAX_NUMBERS];if(numeric(gt,gn,xa,pa,MAX_NUMBERS)>0)score*=.45f;else if(numeric(ans,an,xb,pb,MAX_NUMBERS)>0)score*=.65f;}
    if(entity_conflict(g,ng,gt,a,na,ans))score*=.06f;if(contradictory(g,ng,a,na,gt,ans))score*=.08f;if(score<0)score=0;if(score>.999f)score=.999f;return score;
}
__attribute__((export_name("alloc"))) uint32_t alloc(uint32_t size){if(!size)return 0;uint32_t p=(heap_top+7u)&~7u;if(p>HEAP_SIZE||size>HEAP_SIZE-p)return 0;heap_top=p+size;return p;}
__attribute__((export_name("dealloc"))) void dealloc(uint32_t ptr,uint32_t size){(void)ptr;(void)size;}
__attribute__((export_name("rank_answer"))) float rank_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){return score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ma_ptr,(int)ma_len);}
__attribute__((export_name("breakdown_answer"))) uint32_t breakdown_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){float s=score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ma_ptr,(int)ma_len);bd[0]=s;bd[1]=s;bd[2]=s;bd[3]=(gt_len&&ma_len)?((float)(gt_len<ma_len?gt_len:ma_len)/(float)(gt_len>ma_len?gt_len:ma_len)):0.0f;bd[4]=s;return (uint32_t)(uintptr_t)bd;}
