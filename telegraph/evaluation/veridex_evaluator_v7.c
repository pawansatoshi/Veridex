#include <stdint.h>
#define HEAP_SIZE 4194304u
#define HEAP_LIMIT 3990000u
#define HEAP_BASE 65536u
#define MAX_TOKENS 256
#define MAX_NUMBERS 8

typedef struct { uint32_t h; int st; int len; } Tok;
static uint8_t heap[HEAP_SIZE];
static Tok gbuf[MAX_TOKENS], abuf[MAX_TOKENS], qbuf[MAX_TOKENS];
static double num_a[MAX_NUMBERS], num_b[MAX_NUMBERS];
static int pct_a[MAX_NUMBERS], pct_b[MAX_NUMBERS];
static uint32_t heap_top = HEAP_BASE;
static float bd[5];

static uint8_t lo(uint8_t c){ return (c>='A'&&c<='Z') ? (uint8_t)(c+32) : c; }
static int digit(uint8_t c){ return c>='0'&&c<='9'; }
static int space(uint8_t c){ return c==' '||c=='\n'||c=='\r'||c=='\t'||c=='\f'||c=='\v'; }
static int word(uint8_t c){ return (c>='A'&&c<='Z')||(c>='a'&&c<='z')||digit(c)||c=='_'||c=='-'||c>=128; }
static int eq(const uint8_t*p,int n,const char*s){ int i=0; while(i<n&&s[i]){ if(lo(p[i])!=(uint8_t)s[i]) return 0; i++; } return i==n&&s[i]=='\0'; }
static uint32_t hash(const uint8_t*p,int n){ uint32_t h=2166136261u; for(int i=0;i<n;i++){ h^=lo(p[i]); h*=16777619u; } return h; }
static int stop(const uint8_t*p,int n){
  static const char*sw[]={"a","an","and","are","as","at","be","been","being","by","can","could","did","do","does","for","from","had","has","have","how","i","if","in","is","it","its","may","might","of","on","or","our","that","the","their","this","to","was","we","were","what","when","where","which","who","why","will","with","would","you","your"};
  for(unsigned i=0;i<sizeof(sw)/sizeof(sw[0]);i++) if(eq(p,n,sw[i])) return 1; return 0;
}
static int toks(const uint8_t*s,int n,Tok*out,int cap){
  int p=0,c=0; while(p<n&&c<cap){ while(p<n&&!word(s[p]))p++; if(p>=n)break; int st=p; while(p<n&&word(s[p]))p++; int l=p-st; if(l&&!stop(s+st,l)){ out[c].h=hash(s+st,l); out[c].st=st; out[c].len=l; c++; } } return c;
}
static int has(const Tok*t,int n,uint32_t h){ for(int i=0;i<n;i++) if(t[i].h==h) return 1; return 0; }
static int group(const uint8_t*p,int n){
 static const char*const G[][32]={
 {"fraud","fraudulent","scam","phishing","phish","malicious","malware","fake","counterfeit","deceptive","deception","dangerous","harmful","attack","attacker","compromised","stolen","ponzi","swindle","con"},
 {"safe","legitimate","legit","genuine","authentic","benign","trusted","trustworthy","secure","harmless","clean","reputable"},
 {"positive","bullish","optimistic","favorable","favourable","upbeat"},
 {"negative","bearish","pessimistic","unfavorable","unfavourable","downbeat"},
 {"yes","true","correct","valid","confirmed"},
 {"no","false","incorrect","invalid","denied"},
 {"allowed","permitted","acceptable","okay","ok"},
 {"blocked","forbidden","prohibited","disallowed"},
 {"reduce","reduced","reduces","reducing","decrease","decreased","decreases","decreasing","lower","lowered","lowers","lowering","fall","fell","falls","falling","drop","dropped","drops","dropping","cut","cutting","decline","declined","declines","declining","shrink","shrunk","shrinks","shrinking","sank","sinks"},
 {"increase","increased","increases","increasing","raise","raised","raises","raising","higher","rise","rose","rises","rising","grow","grew","grows","growing","boost","boosted","boosts","climb","climbed","climbs","climbing","surge","surged","surges","jump","jumped","jumps"},
 {"approved","approve","authorized","authorised"},
 {"rejected","reject","unauthorized","unauthorised"}
 };
 static const uint8_t C[]={20,13,6,6,5,5,5,4,32,31,4,4};
 for(int g=0;g<12;g++)for(int i=0;i<C[g];i++)if(eq(p,n,G[g][i]))return g+1;return 0;
}
static int opposite(int g1,int g2){ return (g1==1&&g2==2)||(g1==2&&g2==1)||(g1==3&&g2==4)||(g1==4&&g2==3)||(g1==5&&g2==6)||(g1==6&&g2==5)||(g1==7&&g2==8)||(g1==8&&g2==7)||(g1==9&&g2==10)||(g1==10&&g2==9)||(g1==11&&g2==12)||(g1==12&&g2==11); }
static int contradiction(const uint8_t*gt,int gn,const Tok*g,int ng,const uint8_t*ans,int an,const Tok*a,int na){
  for(int i=0;i<ng;i++){int gg=group(gt+g[i].st,g[i].len); if(!gg)continue; for(int j=0;j<na;j++){int ag=group(ans+a[j].st,a[j].len); if(ag&&opposite(gg,ag)) return 1;}}
  int gtneg=0, anneg=0; static const char*neg[]={"not","no","never","neither","without","cannot","can't","isn't","isnt","wasn't","wasnt","won't","wont"};
  for(unsigned z=0;z<sizeof(neg)/sizeof(neg[0]);z++){ if(!gtneg){for(int i=0;i<ng;i++)if(eq(gt+g[i].st,g[i].len,neg[z])){gtneg=1;break;}} if(!anneg){for(int i=0;i<na;i++)if(eq(ans+a[i].st,a[i].len,neg[z])){anneg=1;break;}} }
  if(gtneg!=anneg) return 1;
  return 0;
}
static int any_nonspace(const uint8_t*s,int n){for(int i=0;i<n;i++)if(!space(s[i]))return 1;return 0;}
static int stem_hash(const uint8_t*p,int n){int m=n;if(m>5&&p[m-3]=='i'&&p[m-2]=='n'&&p[m-1]=='g')m-=3;else if(m>4&&p[m-2]=='e'&&p[m-1]=='d')m-=2;else if(m>3&&p[m-1]=='s'&&p[m-2]!='s'&&p[m-2]!='u')m-=1;return (int)hash(p,m);}
static int stem_match(const uint8_t*a,int an,const uint8_t*b,int bn){return stem_hash(a,an)==stem_hash(b,bn);}
static int exact_normalized_tokens(const Tok*a,int an,const Tok*b,int bn){if(an!=bn)return 0;for(int i=0;i<an;i++)if(a[i].h!=b[i].h)return 0;return 1;}
static int parse_numbers(const uint8_t*s,int n,double*v,int*pct,int cap){
  int p=0,c=0;while(p<n&&c<cap){while(p<n&&!digit(s[p])&&s[p]!='.')p++;if(p>=n)break;double x=0.0;int any=0,dot=0;double place=.1;
    while(p<n){uint8_t ch=s[p];if(digit(ch)){if(!dot)x=x*10+(ch-'0');else{x+=(ch-'0')*place;place*=.1;}any=1;p++;continue;}if(ch==','||ch=='_'){p++;continue;}if(ch=='.'&&!dot){dot=1;p++;continue;}break;}
    if(!any){p++;continue;}while(p<n&&space(s[p]))p++;int e=p;while(e<n&&((s[e]>='A'&&s[e]<='Z')||(s[e]>='a'&&s[e]<='z')))e++;
    if(e>p){if(e-p==7&&eq(s+p,7,"million")){x*=1000000.0;p=e;}else if(e-p==8&&eq(s+p,8,"thousand")){x*=1000.0;p=e;}else if(e-p==8&&eq(s+p,8,"trillion")){x*=1000000000000.0;p=e;}else if(e-p==7&&eq(s+p,7,"billion")){x*=1000000000.0;p=e;}}
    if(p<n&&(s[p]=='k'||s[p]=='K')){x*=1000.0;p++;}else if(p<n&&(s[p]=='m'||s[p]=='M')){x*=1000000.0;p++;}else if(p<n&&(s[p]=='b'||s[p]=='B')){x*=1000000000.0;p++;}
    pct[c]=(p<n&&s[p]=='%');if(pct[c])p++;v[c++]=x;
  }return c;
}
static int numeric_quality(const uint8_t*gt,int gn,const uint8_t*ans,int an){int na=parse_numbers(gt,gn,num_a,pct_a,MAX_NUMBERS),nb=parse_numbers(ans,an,num_b,pct_b,MAX_NUMBERS);if(na==0&&nb==0)return 0;if(na==0||nb==0||na!=nb)return -1;for(int i=0;i<na;i++){double s=num_a[i]>num_b[i]?num_a[i]:num_b[i];if(s<1)s=1;double d=num_a[i]>num_b[i]?num_a[i]-num_b[i]:num_b[i]-num_a[i];if(pct_a[i]!=pct_b[i]||d>s*.001+1e-6)return -1;}return 1;}
static float char3(const uint8_t*a,int an,const uint8_t*b,int bn){if(an<3||bn<3)return 0.0f;if(an>2048)an=2048;if(bn>2048)bn=2048;int hit=0,total=0;for(int i=0;i<=an-3;i++){uint32_t h=hash(a+i,3);int seen=0;for(int j=0;j<=bn-3;j++)if(hash(b+j,3)==h){seen=1;break;}if(seen)hit++;total++;}int totalb=0;for(int j=0;j<=bn-3;j++){uint32_t h=hash(b+j,3);int seen=0;for(int i=0;i<=an-3;i++)if(hash(a+i,3)==h){seen=1;break;}if(seen)totalb++;}int den=total+totalb-hit;return den?((float)hit/(float)den):0.0f;}
static int likely_entity(const uint8_t*s,const Tok*t,int index,const Tok*all,int nall){(void)index;if(t->len<2)return 0;uint8_t c=s[t->st];if(c<'A'||c>'Z')return 0;if(eq(s+t->st,t->len,"The")||eq(s+t->st,t->len,"This")||eq(s+t->st,t->len,"What")||eq(s+t->st,t->len,"Which")||eq(s+t->st,t->len,"How")||eq(s+t->st,t->len,"Did")||eq(s+t->st,t->len,"Is")||eq(s+t->st,t->len,"A")||eq(s+t->st,t->len,"An"))return 0;if(index==0&&nall>1){const char*rv[]={"reported","announced","said","issued","published","acquired","launched","released","warned","filed","confirmed","denied","approved"};for(unsigned k=0;k<sizeof(rv)/sizeof(rv[0]);k++)if(eq(s+all[1].st,all[1].len,rv[k]))return 1;return 0;}return 1;}
static int entity_conflict(const Tok*gt,int ng,const uint8_t*gts,const Tok*ans,int na,const uint8_t*anss,const Tok*q,int nq,const uint8_t*qs){uint32_t known[32];int kc=0;for(int i=0;i<ng&&kc<32;i++)if(likely_entity(gts,&gt[i],i,gt,ng))known[kc++]=gt[i].h;for(int i=0;i<nq&&kc<32;i++)if(likely_entity(qs,&q[i],i,q,nq))known[kc++]=q[i].h;if(kc==0)return 0;for(int i=0;i<na;i++)if(likely_entity(anss,&ans[i],i,ans,na)){int ok=0;for(int j=0;j<kc;j++)if(known[j]==ans[i].h){ok=1;break;}if(!ok)return 1;}return 0;}
static int has_word_literal(const Tok*t,int n,const uint8_t*s,const char*w){for(int i=0;i<n;i++)if(eq(s+t[i].st,t[i].len,w))return 1;return 0;}
static int direction_flip(const Tok*gt,int gn,const uint8_t*gts,const Tok*ans,int an,const uint8_t*anss){const char*lo1[]={"less","fewer","lower","decreased","decrease","reduced","reduce","fall","fell","fallen","drop","dropped","declined","decline"};const char*hi1[]={"more","higher","increased","increase","rise","rose","risen","grow","grew","grown","boost","boosted","surged","surge"};int gl=0,gh=0,al=0,ah=0;for(unsigned k=0;k<sizeof(lo1)/sizeof(lo1[0]);k++){if(!gl)gl=has_word_literal(gt,gn,gts,lo1[k]);if(!al)al=has_word_literal(ans,an,anss,lo1[k]);}for(unsigned k=0;k<sizeof(hi1)/sizeof(hi1[0]);k++){if(!gh)gh=has_word_literal(gt,gn,gts,hi1[k]);if(!ah)ah=has_word_literal(ans,an,anss,hi1[k]);}return (gl&&ah)||(gh&&al);}
static int phrase_less_more_security(const uint8_t*gt,int gn,const uint8_t*ans,int an){int gl=0,gh=0,al=0,ah=0;for(int i=0;i+1<gn;i++){if(eq(gt+gbuf[i].st,gbuf[i].len,"less")&&eq(gt+gbuf[i+1].st,gbuf[i+1].len,"secure"))gl=1;if(eq(gt+gbuf[i].st,gbuf[i].len,"more")&&eq(gt+gbuf[i+1].st,gbuf[i+1].len,"secure"))gh=1;}for(int i=0;i+1<an;i++){if(eq(ans+abuf[i].st,abuf[i].len,"less")&&eq(ans+abuf[i+1].st,abuf[i+1].len,"secure"))al=1;if(eq(ans+abuf[i].st,abuf[i].len,"more")&&eq(ans+abuf[i+1].st,abuf[i+1].len,"secure"))ah=1;}return (gl&&ah)||(gh&&al);}
static float score_text(const uint8_t*q,int qn,const uint8_t*gt,int gn,const uint8_t*ans,int an){
  if(gn<=0||an<=0||!any_nonspace(ans,an))return 0.0f;Tok*g=gbuf,*a=abuf,*qt=qbuf;int ng=toks(gt,gn,g,MAX_TOKENS),na=toks(ans,an,a,MAX_TOKENS),nq=toks(q,qn,qt,MAX_TOKENS);if(ng<=0||na<=0)return 0.0f;if(exact_normalized_tokens(g,ng,a,na))return 1.0f;
  int common=0,stemc=0,semc=0,adj=0;for(int i=0;i<ng;i++){int found=0,sfound=0,sg=group(gt+g[i].st,g[i].len);for(int j=0;j<na;j++){if(g[i].h==a[j].h){found=1;sfound=1;break;}if(!sfound&&stem_match(gt+g[i].st,g[i].len,ans+a[j].st,a[j].len))sfound=1;}if(found)common++;if(sfound)stemc++;if(sg){for(int j=0;j<na;j++)if(group(ans+a[j].st,a[j].len)==sg){semc++;break;}}}
  for(int i=0;i+1<ng;i++)if(has(a,na,g[i].h)&&has(a,na,g[i+1].h))adj++;float prec=(float)common/(float)na,rec=(float)common/(float)ng,stem=(float)stemc/(float)ng,sem=(float)semc/(float)ng,phrase=(ng>1)?((float)adj/(float)(ng-1)):0.0f,cgram=char3(gt,gn,ans,an),len=(float)(gn<an?gn:an)/(float)(gn>an?gn:an);float score=.24f*prec+.25f*rec+.16f*stem+.15f*sem+.10f*phrase+.10f*cgram+.04f*len;
  if(ng<=3){int gg=group(gt+g[0].st,g[0].len);int same=0;for(int j=0;j<na;j++)if(group(ans+a[j].st,a[j].len)==gg){same=1;break;}if(gg&&same)score=score>0.90f?score:0.90f;}
  int nqcommon=0;for(int i=0;i<nq;i++){if(group(q+qt[i].st,qt[i].len))continue;if(has(g,ng,qt[i].h))nqcommon++;}if(nq>0&&nqcommon>0)score+=0.03f;int nqnum=0;for(int i=0;i<qn;i++)if(digit(q[i])){nqnum=1;break;}if(nqnum){double tmp[1];int tp[1];if(parse_numbers(ans,an,tmp,tp,1)==0)score*=.85f;}int nq4=numeric_quality(gt,gn,ans,an);if(nq4==1)score+=.18f;else if(nq4<0)score*=.32f;if(entity_conflict(g,ng,gt,a,na,ans,qt,nq,q))score*=.10f;if(direction_flip(g,ng,gt,a,na,ans))score*=.10f;if(phrase_less_more_security(gt,gn,ans,an))score*=.10f;if(contradiction(gt,gn,g,ng,ans,an,a,na))score*=.08f;if(score<0)score=0;if(score>0.999f)score=0.999f;return score;
}
__attribute__((export_name("alloc"))) uint32_t alloc(uint32_t size){if(!size)return 0;uint32_t p=(heap_top+7u)&~7u;if(p>HEAP_LIMIT||size>HEAP_LIMIT-p){heap_top=HEAP_BASE;p=HEAP_BASE;if(size>HEAP_LIMIT-p)return 0;}heap_top=p+size;return p;}
__attribute__((export_name("dealloc"))) void dealloc(uint32_t ptr,uint32_t size){if(size&&ptr>=HEAP_BASE&&ptr+size==heap_top)heap_top=ptr;}
__attribute__((export_name("rank_answer"))) float rank_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){return score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ma_ptr,(int)ma_len);}
__attribute__((export_name("breakdown_answer"))) uint32_t breakdown_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){float s=rank_answer(q_ptr,q_len,gt_ptr,gt_len,ma_ptr,ma_len);bd[0]=s;bd[1]=s;bd[2]=s;bd[3]=(gt_len&&ma_len)?((float)(gt_len<ma_len?gt_len:ma_len)/(float)(gt_len>ma_len?gt_len:ma_len)):0.0f;bd[4]=s;return (uint32_t)(uintptr_t)bd;}
