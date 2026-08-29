#include <stdint.h>
#define HEAP_SIZE 4194304u
#define HEAP_BASE 65536u
#define HEAP_LIMIT 3990000u
#define MAXTOK 384
#define MAXNUM 16

typedef struct { uint32_t h; uint16_t st,len; uint8_t content; } Tok;
static uint8_t heap[HEAP_SIZE];
static Tok G[MAXTOK],A[MAXTOK],Q[MAXTOK];
static double GN[MAXNUM],AN[MAXNUM]; static int GP[MAXNUM],AP[MAXNUM];
static uint32_t top=HEAP_BASE;
static uint8_t lower(uint8_t c){return c>='A'&&c<='Z'?(uint8_t)(c+32):c;}
static int digit(uint8_t c){return c>='0'&&c<='9';}
static int ws(uint8_t c){return c==' '||c=='\n'||c=='\r'||c=='\t'||c=='\f'||c=='\v';}
static int nonspace(const uint8_t*s,int n){for(int i=0;i<n;i++)if(!ws(s[i]))return 1;return 0;}
static int alpha8(uint8_t c){return (c>='A'&&c<='Z')||(c>='a'&&c<='z')||c>=128;}
static int word(uint8_t c){return alpha8(c)||digit(c)||c=='_'||c=='-'||c>=128;}
static uint32_t hsh(const uint8_t*p,int n){uint32_t h=2166136261u;for(int i=0;i<n;i++){h^=lower(p[i]);h*=16777619u;}return h;}
static int eq(const uint8_t*p,int n,const char*s){int i=0;while(i<n&&s[i]){if(lower(p[i])!=(uint8_t)s[i])return 0;i++;}return i==n&&s[i]==0;}
static int stop(const uint8_t*p,int n){static const char* S[]={"a","an","and","are","as","at","be","been","being","by","can","could","did","do","does","for","from","had","has","have","how","i","if","in","is","it","its","may","might","of","on","or","our","that","the","their","this","to","was","we","were","what","when","where","which","who","why","will","with","would","you","your"};for(unsigned i=0;i<sizeof(S)/sizeof(S[0]);i++)if(eq(p,n,S[i]))return 1;return 0;}
static int toks(const uint8_t*s,int n,Tok*out,int cap){int p=0,c=0;while(p<n&&c<cap){while(p<n&&!word(s[p]))p++;if(p>=n)break;int st=p;while(p<n&&word(s[p]))p++;int l=p-st;if(l){out[c].h=hsh(s+st,l);out[c].st=(uint16_t)st;out[c].len=(uint16_t)l;out[c].content=(uint8_t)!stop(s+st,l);c++;}}return c;}
static int has(const Tok*t,int n,uint32_t h){for(int i=0;i<n;i++)if(t[i].h==h)return 1;return 0;}
/* Conservative semantic families. Opposite families are deliberately separate. */
static int family(const uint8_t*p,int n){
 static const char* const F[][24]={
 {"fraud","fraudulent","scam","phishing","malicious","malware","fake","counterfeit","deceptive","dangerous","harmful","attack","compromised","stolen","ponzi","exploit"},
 {"safe","legitimate","legit","genuine","authentic","benign","trusted","trustworthy","secure","harmless","clean"},
 {"positive","bullish","optimistic","favorable","favourable","upbeat"},
 {"negative","bearish","pessimistic","unfavorable","unfavourable","downbeat"},
 {"yes","true","correct","valid","confirmed","approved","authorized","authorised"},
 {"no","false","incorrect","invalid","denied","rejected","unauthorized","unauthorised"},
 {"allowed","permitted","acceptable","okay","ok"},
 {"blocked","forbidden","prohibited","disallowed"},
 {"reduce","reduced","reduces","reducing","decrease","decreased","decreases","decreasing","lower","lowered","lowers","fall","fell","falls","drop","dropped","drops","cut","cutting"},
 {"increase","increased","increases","increasing","raise","raised","raises","higher","rise","rose","rises","grow","grew","grows","boost","boosted"},
 {"up","upward","gain","gained","gains","growth"},
 {"down","downward","loss","lost","losses","decline","declined","declines"}
 };
 static const uint8_t N[]={16,11,6,6,8,8,5,4,20,18,6,6};
 for(int g=0;g<12;g++)for(int i=0;i<N[g];i++)if(eq(p,n,F[g][i]))return g+1;return 0;
}
static int opp(int a,int b){return (a==1&&b==2)||(a==2&&b==1)||(a==3&&b==4)||(a==4&&b==3)||(a==5&&b==6)||(a==6&&b==5)||(a==7&&b==8)||(a==8&&b==7)||(a==9&&b==10)||(a==10&&b==9)||(a==11&&b==12)||(a==12&&b==11);}
static int contradiction(const Tok*g,int ng,const uint8_t*gt,const Tok*a,int na,const uint8_t*ans){for(int i=0;i<ng;i++){int x=family(gt+g[i].st,g[i].len);if(!x)continue;for(int j=0;j<na;j++){int y=family(ans+a[j].st,a[j].len);if(y&&opp(x,y))return 1;}}return 0;}
static int stem(const uint8_t*a,int an,const uint8_t*b,int bn){int x=an,y=bn;if(x>5&&lower(a[x-3])=='i'&&lower(a[x-2])=='n'&&lower(a[x-1])=='g')x-=3;else if(x>4&&lower(a[x-2])=='e'&&lower(a[x-1])=='d')x-=2;else if(x>3&&lower(a[x-1])=='s'&&lower(a[x-2])!='s')x--;if(y>5&&lower(b[y-3])=='i'&&lower(b[y-2])=='n'&&lower(b[y-1])=='g')y-=3;else if(y>4&&lower(b[y-2])=='e'&&lower(b[y-1])=='d')y-=2;else if(y>3&&lower(b[y-1])=='s'&&lower(b[y-2])!='s')y--;if(x!=y)return 0;for(int i=0;i<x;i++)if(lower(a[i])!=lower(b[i]))return 0;return 1;}
static int nums(const uint8_t*s,int n,double*v,int*pct){int p=0,c=0;while(p<n&&c<MAXNUM){while(p<n&&!digit(s[p])&&s[p]!='.')p++;if(p>=n)break;double x=0,pl=.1;int any=0,dot=0;while(p<n){uint8_t z=s[p];if(digit(z)){if(dot){x+=(z-'0')*pl;pl*=.1;}else x=x*10+(z-'0');any=1;p++;continue;}if(z==','||z=='_'){p++;continue;}if(z=='.'&&!dot){dot=1;p++;continue;}break;}if(!any){p++;continue;}while(p<n&&ws(s[p]))p++;if(p<n&&(s[p]=='k'||s[p]=='K')){x*=1e3;p++;}else if(p<n&&(s[p]=='m'||s[p]=='M')){x*=1e6;p++;}else if(p<n&&(s[p]=='b'||s[p]=='B')){x*=1e9;p++;}pct[c]=(p<n&&s[p]=='%');if(pct[c])p++;v[c++]=x;}return c;}
static int numeric(const uint8_t*g,int gn,const uint8_t*a,int an){int ng=nums(g,gn,GN,GP),na=nums(a,an,AN,AP);if(!ng&&!na)return 0;if(ng!=na)return -1;for(int i=0;i<ng;i++){double m=GN[i]>AN[i]?GN[i]:AN[i];if(m<1)m=1;double d=GN[i]>AN[i]?GN[i]-AN[i]:AN[i]-GN[i];if(GP[i]!=AP[i]||d>m*.001+1e-6)return -1;}return 1;}
static int entity_conflict(const Tok*g,int ng,const uint8_t*gt,const Tok*a,int na,const uint8_t*ans,const Tok*q,int nq,const uint8_t*qs){uint32_t known[64];int k=0;for(int i=0;i<ng&&k<64;i++){int st=g[i].st;if(g[i].len>1&&gt[st]>='A'&&gt[st]<='Z')known[k++]=g[i].h;}for(int i=0;i<nq&&k<64;i++){int st=q[i].st;if(q[i].len>1&&qs[st]>='A'&&qs[st]<='Z')known[k++]=q[i].h;}for(int i=0;i<na;i++){int st=a[i].st;if(a[i].len<2||ans[st]<'A'||ans[st]>'Z')continue;int ok=0;for(int j=0;j<k;j++)if(known[j]==a[i].h){ok=1;break;}if(k&& !ok)return 1;}return 0;}
static int qtype(const uint8_t*q,int qn){Tok t[32];int n=toks(q,qn,t,32);for(int i=0;i<n;i++){if(eq(q+t[i].st,t[i].len,"who")||eq(q+t[i].st,t[i].len,"where")||eq(q+t[i].st,t[i].len,"when"))return 1;if(eq(q+t[i].st,t[i].len,"how")&&i+1<n&&(eq(q+t[i+1].st,t[i+1].len,"much")||eq(q+t[i+1].st,t[i+1].len,"many")))return 2;if(eq(q+t[i].st,t[i].len,"is")||eq(q+t[i].st,t[i].len,"are")||eq(q+t[i].st,t[i].len,"does"))return 3;}return 0;}
static int answer_shape(const uint8_t*a,int an,int type){if(type==2){double v[1];int p[1];return nums(a,an,v,p)>0;}if(type==3){Tok t[32];int n=toks(a,an,t,32);for(int i=0;i<n;i++){int f=family(a+t[i].st,t[i].len);if(f==5||f==6)return 1;}}return 0;}
static float score(const uint8_t*q,int qn,const uint8_t*gt,int gn,const uint8_t*a,int an){
 if(gn<=0||an<=0||!nonspace(a,an))return 0.0f;
 Tok*g=G,*x=A,*qt=Q;int ng=toks(gt,gn,g,MAXTOK),na=toks(a,an,x,MAXTOK),nq=toks(q,qn,qt,MAXTOK);if(!ng||!na)return 0.0f;
 int exact=ng==na;for(int i=0;exact&&i<ng;i++)if(g[i].h!=x[i].h)exact=0;if(exact)return 1.0f;
 int gs=0,as=0,common=0,stc=0,semc=0;for(int i=0;i<ng;i++)if(g[i].content)gs++;for(int i=0;i<na;i++)if(x[i].content)as++;
 for(int i=0;i<ng;i++)if(g[i].content){for(int j=0;j<na;j++)if(g[i].h==x[j].h){common++;break;}for(int j=0;j<na;j++)if(stem(gt+g[i].st,g[i].len,a+x[j].st,x[j].len)){stc++;break;}int f=family(gt+g[i].st,g[i].len);if(f)for(int j=0;j<na;j++)if(family(a+x[j].st,x[j].len)==f){semc++;break;}}
 float p=(float)common/(as?as:1),r=(float)common/(gs?gs:1),st=(float)stc/(gs?gs:1),sem=(float)semc/(gs?gs:1);
 float base=.23f*p+.22f*r+.18f*st+.20f*sem;
 int qcommon=0;for(int i=0;i<nq;i++)if(qt[i].content&&has(g,ng,qt[i].h))qcommon++;if(nq&&qcommon)base+=.025f;
 int type=qtype(q,qn);if(type==2&&answer_shape(a,an,type))base+=.035f;else if(type==2)base*=.80f;if(type==3&&answer_shape(a,an,type))base+=.025f;
 int nv=numeric(gt,gn,a,an);if(nv==1)base+=.18f;else if(nv<0)base*=.22f;
 if(entity_conflict(g,ng,gt,x,na,a,qt,nq,q))base*=.12f;
 if(contradiction(g,ng,gt,x,na,a))base*=.06f;
 if(base<0)base=0;if(base>.999f)base=.999f;return base;
}
__attribute__((export_name("alloc"))) uint32_t alloc(uint32_t n){if(!n)return 0;uint32_t p=(top+7u)&~7u;if(p>HEAP_LIMIT||n>HEAP_LIMIT-p){top=HEAP_BASE;p=HEAP_BASE;if(n>HEAP_LIMIT-p)return 0;}top=p+n;return p;}
__attribute__((export_name("dealloc"))) void dealloc(uint32_t p,uint32_t n){(void)p;(void)n;}
__attribute__((export_name("rank_answer"))) float rank_answer(uint32_t qp,uint32_t ql,uint32_t gp,uint32_t gl,uint32_t ap,uint32_t al){return score((const uint8_t*)(uintptr_t)qp,(int)ql,(const uint8_t*)(uintptr_t)gp,(int)gl,(const uint8_t*)(uintptr_t)ap,(int)al);}
__attribute__((export_name("breakdown_answer"))) uint32_t breakdown_answer(uint32_t qp,uint32_t ql,uint32_t gp,uint32_t gl,uint32_t ap,uint32_t al){(void)qp;(void)ql;(void)gp;(void)gl;(void)ap;(void)al;return 0;}
