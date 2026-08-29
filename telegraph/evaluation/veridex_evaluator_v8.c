#include <stdint.h>
#include <stddef.h>
#define HEAP_SIZE 4194304u
#define HEAP_BASE 65536u
#define HEAP_LIMIT 3990000u
#define MAX_TOKENS 384
#define MAX_NUMBERS 16
#define MAX_ENTITIES 48

typedef struct { uint32_t h; int st; int len; int content; } Tok;
static uint8_t heap[HEAP_SIZE];
static Tok gt_buf[MAX_TOKENS], ans_buf[MAX_TOKENS], q_buf[MAX_TOKENS];
static double gt_nums[MAX_NUMBERS], ans_nums[MAX_NUMBERS];
static int gt_pct[MAX_NUMBERS], ans_pct[MAX_NUMBERS];
static float bd[5];
static uint32_t heap_top = HEAP_BASE;

static uint8_t lo(uint8_t c){return (c>='A'&&c<='Z')?(uint8_t)(c+32):c;}
static int digit(uint8_t c){return c>='0'&&c<='9';}
static int spacec(uint8_t c){return c==' '||c=='\n'||c=='\r'||c=='\t'||c=='\f'||c=='\v';}
static int alpha(uint8_t c){return (c>='A'&&c<='Z')||(c>='a'&&c<='z')||c>=128;}
static int wordc(uint8_t c){return alpha(c)||digit(c)||c=='_'||c=='-'||c>=128;}
static int eq(const uint8_t*p,int n,const char*s){int i=0;while(i<n&&s[i]){if(lo(p[i])!=(uint8_t)s[i])return 0;i++;}return i==n&&s[i]=='\0';}
static uint32_t hashw(const uint8_t*p,int n){uint32_t h=2166136261u;for(int i=0;i<n;i++){h^=lo(p[i]);h*=16777619u;}return h;}
static int stop(const uint8_t*p,int n){
 const char*sw[]={"a","an","and","are","as","at","be","been","being","by","can","could","did","do","does","for","from","had","has","have","how","i","if","in","is","it","its","may","might","of","on","or","our","that","the","their","this","to","was","we","were","what","when","where","which","who","why","will","with","would","you","your"};
 for(unsigned i=0;i<sizeof(sw)/sizeof(sw[0]);i++)if(eq(p,n,sw[i]))return 1;return 0;
}
static int toks(const uint8_t*s,int n,Tok*out,int cap){int p=0,c=0;while(p<n&&c<cap){while(p<n&&!wordc(s[p]))p++;if(p>=n)break;int st=p;while(p<n&&wordc(s[p]))p++;int l=p-st;if(l){out[c].h=hashw(s+st,l);out[c].st=st;out[c].len=l;out[c].content=!stop(s+st,l);c++;}}return c;}
static int has(const Tok*t,int n,uint32_t h){for(int i=0;i<n;i++)if(t[i].h==h)return 1;return 0;}
static int group(const uint8_t*p,int n){
 static const char*const G[][32]={
  {"fraud","fraudulent","scam","phishing","phish","malicious","malware","fake","counterfeit","deceptive","deception","dangerous","harmful","attack","attacker","compromised","stolen","ponzi","exploit","exploited"},
  {"safe","legitimate","legit","genuine","authentic","benign","trusted","trustworthy","secure","harmless","clean"},
  {"positive","bullish","optimistic","favorable","favourable","upbeat"},
  {"negative","bearish","pessimistic","unfavorable","unfavourable","downbeat"},
  {"yes","true","correct","valid","confirmed","approved","approve","authorized","authorised"},
  {"no","false","incorrect","invalid","denied","rejected","reject","unauthorized","unauthorised"},
  {"allowed","permitted","acceptable","okay","ok"},
  {"blocked","forbidden","prohibited","disallowed"},
  {"reduce","reduced","reduces","reducing","decrease","decreased","decreases","decreasing","lower","lowered","lowers","lowering","fall","fell","falls","falling","drop","dropped","drops","dropping","cut","cutting"},
  {"increase","increased","increases","increasing","raise","raised","raises","raising","higher","rise","rose","rises","rising","grow","grew","grows","growing","boost","boosted","boosts"},
  {"up","upward","gain","gained","gains","growth"},
  {"down","downward","loss","lost","losses","decline","declined","declines"}
 };
 static const uint8_t C[]={20,11,6,6,9,9,5,4,22,20,6,6};
 for(int g=0;g<12;g++)for(int i=0;i<C[g];i++)if(eq(p,n,G[g][i]))return g+1;return 0;
}
static int opposite(int a,int b){return (a==1&&b==2)||(a==2&&b==1)||(a==3&&b==4)||(a==4&&b==3)||(a==5&&b==6)||(a==6&&b==5)||(a==7&&b==8)||(a==8&&b==7)||(a==9&&b==10)||(a==10&&b==9)||(a==11&&b==12)||(a==12&&b==11);}
static int contradiction(const Tok*g,int gn,const uint8_t*gt,const Tok*a,int an,const uint8_t*ans){for(int i=0;i<gn;i++){int gg=group(gt+g[i].st,g[i].len);if(!gg)continue;for(int j=0;j<an;j++){int ag=group(ans+a[j].st,a[j].len);if(ag&&opposite(gg,ag))return 1;}}return 0;}
static int parse_numbers(const uint8_t*s,int n,double*v,int*pct,int cap){
 int p=0,c=0;while(p<n&&c<cap){while(p<n&&!digit(s[p])&&s[p]!='.')p++;if(p>=n)break;double x=0.0;int any=0,dot=0;double place=.1;while(p<n){uint8_t ch=s[p];if(digit(ch)){if(!dot)x=x*10+(ch-'0');else{x+=(ch-'0')*place;place*=.1;}any=1;p++;continue;}if(ch==','||ch=='_'){p++;continue;}if(ch=='.'&&!dot){dot=1;p++;continue;}break;}if(!any){p++;continue;}while(p<n&&spacec(s[p]))p++;if(p<n&&(s[p]=='k'||s[p]=='K')){x*=1e3;p++;}else if(p<n&&(s[p]=='m'||s[p]=='M')){x*=1e6;p++;}else if(p<n&&(s[p]=='b'||s[p]=='B')){x*=1e9;p++;}else {int e=p;while(e<n&&alpha(s[e]))e++;if(e-p==7&&eq(s+p,7,"million")){x*=1e6;p=e;}else if(e-p==8&&eq(s+p,8,"thousand")){x*=1e3;p=e;}else if(e-p==6&&eq(s+p,6,"trillion")){x*=1e12;p=e;}else if(e-p==7&&eq(s+p,7,"billion")){x*=1e9;p=e;}}pct[c]=(p<n&&s[p]=='%');if(pct[c])p++;v[c++]=x;}return c;}
static int nums_ok(const uint8_t*gt,int gn,const uint8_t*ans,int an){int na=parse_numbers(gt,gn,gt_nums,gt_pct,MAX_NUMBERS),nb=parse_numbers(ans,an,ans_nums,ans_pct,MAX_NUMBERS);if(na==0&&nb==0)return 0;if(na==0||nb==0||na!=nb)return -1;for(int i=0;i<na;i++){double s=gt_nums[i]>ans_nums[i]?gt_nums[i]:ans_nums[i];if(s<1)s=1;double d=gt_nums[i]>ans_nums[i]?gt_nums[i]-ans_nums[i]:ans_nums[i]-gt_nums[i];if(gt_pct[i]!=ans_pct[i]||d>s*.001+1e-6)return -1;}return 1;}
static int stem_eq(const uint8_t*a,int an,const uint8_t*b,int bn){int am=an,bm=bn;if(am>5&&lo(a[am-3])=='i'&&lo(a[am-2])=='n'&&lo(a[am-1])=='g')am-=3;else if(am>4&&lo(a[am-2])=='e'&&lo(a[am-1])=='d')am-=2;else if(am>3&&lo(a[am-1])=='s'&&lo(a[am-2])!='s'&&lo(a[am-2])!='u')am--;if(bm>5&&lo(b[bm-3])=='i'&&lo(b[bm-2])=='n'&&lo(b[bm-1])=='g')bm-=3;else if(bm>4&&lo(b[bm-2])=='e'&&lo(b[bm-1])=='d')bm-=2;else if(bm>3&&lo(b[bm-1])=='s'&&lo(b[bm-2])!='s'&&lo(b[bm-2])!='u')bm--;if(am!=bm)return 0;for(int i=0;i<am;i++)if(lo(a[i])!=lo(b[i]))return 0;return 1;}
static int entity_conflict(const Tok*g,int ng,const uint8_t*gt,const Tok*a,int na,const uint8_t*ans,const Tok*q,int nq,const uint8_t*qs){uint32_t known[MAX_ENTITIES];int k=0;for(int i=0;i<ng&&k<MAX_ENTITIES;i++){int st=g[i].st;if(g[i].len>=2&&gt[st]>='A'&&gt[st]<='Z')known[k++]=g[i].h;}for(int i=0;i<nq&&k<MAX_ENTITIES;i++){int st=q[i].st;if(q[i].len>=2&&qs[st]>='A'&&qs[st]<='Z')known[k++]=q[i].h;}if(k==0)return 0;for(int i=0;i<na;i++){int st=a[i].st;if(a[i].len<2||ans[st]<'A'||ans[st]>'Z')continue;int ok=0;for(int j=0;j<k;j++)if(known[j]==a[i].h){ok=1;break;}if(!ok)return 1;}return 0;}
static float chargram(const uint8_t*a,int an,const uint8_t*b,int bn,int ngram){if(an<ngram||bn<ngram)return 0.0f;if(an>1536)an=1536;if(bn>1536)bn=1536;int hit=0,total=0;for(int i=0;i<=an-ngram;i++){uint32_t h=hashw(a+i,ngram);int seen=0;for(int j=0;j<=bn-ngram;j++)if(hashw(b+j,ngram)==h){seen=1;break;}if(seen)hit++;total++;}int hb=0;for(int j=0;j<=bn-ngram;j++){uint32_t h=hashw(b+j,ngram);int seen=0;for(int i=0;i<=an-ngram;i++)if(hashw(a+i,ngram)==h){seen=1;break;}if(seen)hb++;}int den=total+hb-hit;return den?((float)hit/(float)den):0.0f;}
static float score_text(const uint8_t*q,int qn,const uint8_t*gt,int gn,const uint8_t*ans,int an){
 if(gn<=0||an<=0||!any_nonspace(ans,an))return 0.0f;Tok *g=gt_buf,*a=ans_buf,*qt=q_buf;int ng=toks(gt,gn,g,MAX_TOKENS),na=toks(ans,an,a,MAX_TOKENS),nq=toks(q,qn,qt,MAX_TOKENS);if(ng<=0||na<=0)return 0.0f;
 int exact=1;if(ng!=na)exact=0;else for(int i=0;i<ng;i++)if(g[i].h!=a[i].h){exact=0;break;}if(exact)return 1.0f;
 int gt_sig=0,ans_sig=0,common=0,stemc=0,semc=0;for(int i=0;i<ng;i++)if(g[i].content)gt_sig++;for(int i=0;i<na;i++)if(a[i].content)ans_sig++;
 for(int i=0;i<ng;i++){if(!g[i].content)continue;for(int j=0;j<na;j++){if(g[i].h==a[j].h){common++;break;}}int st=0;for(int j=0;j<na;j++)if(stem_eq(gt+g[i].st,g[i].len,ans+a[j].st,a[j].len)){st=1;break;}if(st)stemc++;int gg=group(gt+g[i].st,g[i].len);if(gg)for(int j=0;j<na;j++)if(group(ans+a[j].st,a[j].len)==gg){semc++;break;}}
 float prec=(float)common/(float)(ans_sig?ans_sig:1),rec=(float)common/(float)(gt_sig?gt_sig:1),stem=(float)stemc/(float)(gt_sig?gt_sig:1),sem=(float)semc/(float)(gt_sig?gt_sig:1),c3=chargram(gt,gn,ans,an,3),c2=chargram(gt,gn,ans,an,2),len=(float)(gn<an?gn:an)/(float)(gn>an?gn:an),phrase=0.0f;
 int adjden=ng>1?ng-1:0;if(adjden){int hit=0;for(int i=0;i<ng-1;i++)if(has(a,na,g[i].h)&&has(a,na,g[i+1].h))hit++;phrase=(float)hit/(float)adjden;}
 float score=.20f*prec+.19f*rec+.18f*stem+.18f*sem+.08f*phrase+.09f*c3+.04f*c2+.04f*len;
 if(gt_sig<=3 && sem>0.0f && !contradiction(g,ng,gt,a,na,ans)) score=0.92f+0.06f*sem;
 if(sem>0.35f&&!contradiction(g,ng,gt,a,na,ans))score+=0.07f;
 int nqcommon=0;for(int i=0;i<nq;i++)if(qt[i].content&&has(g,ng,qt[i].h))nqcommon++;if(nq>0&&nqcommon>0)score+=0.02f;
 int nqnum=0;for(int i=0;i<qn;i++)if(digit(q[i])){nqnum=1;break;}if(nqnum){double tv[1];int tp[1];if(parse_numbers(ans,an,tv,tp,1)==0)score*=0.82f;}
 int nqv=nums_ok(gt,gn,ans,an);if(nqv==1)score+=0.18f;else if(nqv<0)score*=0.28f;
 if(entity_conflict(g,ng,gt,a,na,ans,qt,nq,q))score*=0.10f;
 if(contradiction(g,ng,gt,a,na,ans))score*=0.06f;
 if(score<0)score=0;if(score>0.999f)score=0.999f;return score;
}
__attribute__((export_name("alloc"))) uint32_t alloc(uint32_t size){if(!size)return 0;uint32_t p=(heap_top+7u)&~7u;if(p>HEAP_LIMIT||size>HEAP_LIMIT-p){heap_top=HEAP_BASE;p=HEAP_BASE;if(size>HEAP_LIMIT-p)return 0;}heap_top=p+size;return p;}
__attribute__((export_name("dealloc"))) void dealloc(uint32_t ptr,uint32_t size){(void)ptr;(void)size;}
__attribute__((export_name("rank_answer"))) float rank_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){return score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ma_ptr,(int)ma_len);}
__attribute__((export_name("breakdown_answer"))) uint32_t breakdown_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){const uint8_t*q=(const uint8_t*)(uintptr_t)q_ptr;const uint8_t*gt=(const uint8_t*)(uintptr_t)gt_ptr;const uint8_t*ans=(const uint8_t*)(uintptr_t)ma_ptr;int ng=toks(gt,(int)gt_len,gt_buf,MAX_TOKENS),na=toks(ans,(int)ma_len,ans_buf,MAX_TOKENS);float s=score_text(q,(int)q_len,gt,(int)gt_len,ans,(int)ma_len);bd[0]=s;bd[1]=(float)nums_ok(gt,(int)gt_len,ans,(int)ma_len);bd[2]=(float)contradiction(gt_buf,ng,gt,ans_buf,na,ans);bd[3]=(ng>0&&na>0)?((float)((ng<na)?ng:na)/(float)((ng>na)?ng:na)):0.0f;bd[4]=(float)s;return (uint32_t)(uintptr_t)bd;}
