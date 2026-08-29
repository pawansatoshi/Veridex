#include <stdint.h>
#define HEAP_SIZE (1024 * 1024)
static unsigned char heap[HEAP_SIZE]; static uint32_t hp = 16; static float out[5];
__attribute__((export_name("alloc"))) uint32_t alloc(uint32_t n){n=(n+7u)&~7u;if(!n||hp+n>HEAP_SIZE)return 0;uint32_t p=hp;hp+=n;return p;}
__attribute__((export_name("dealloc"))) void dealloc(uint32_t p,uint32_t n){n=(n+7u)&~7u;if(p+n==hp&&p>=16u)hp=p;}
static int eq(const char*a,const char*b,uint32_t n){for(uint32_t i=0;i<n;i++)if(a[i]!=b[i])return 0;return 1;}
static int find(const char*s,uint32_t n,const char*k,const char**v,uint32_t*l){uint32_t m=0;while(k[m])m++;for(uint32_t i=0;i+m<n;i++){if(!eq(s+i,k,m))continue;uint32_t j=i+m;while(j<n&&(s[j]==' '||s[j]=='\t'||s[j]=='\r'||s[j]=='\n'||s[j]==':'||s[j]=='\"'))j++;if(j+6<=n&&eq(s+j,"active",6)){*v=s+j;*l=6;return 1;}if(j+11<=n&&eq(s+j,"not_detected",11)){*v=s+j;*l=11;return 1;}if(j+7<=n&&eq(s+j,"unknown",7)){*v=s+j;*l=7;return 1;}}return 0;}
static int same(const char*a,uint32_t an,const char*b,uint32_t bn){return an==bn&&eq(a,b,an);}
static float score(const char*g,uint32_t gn,const char*a,uint32_t an,const char*k){const char*gv=0,*av=0;uint32_t gl=0,al=0;if(!find(a,an,k,&av,&al))return 0.0f;int gh=find(g,gn,k,&gv,&gl);if(!gh)return same(av,al,"unknown",7)?1.0f:0.25f;if(same(av,al,gv,gl))return 1.0f;if(same(gv,gl,"unknown",7))return 0.25f;return 0.0f;}
__attribute__((export_name("rank_answer"))) float rank_answer(uint32_t q,uint32_t qn,uint32_t gp,uint32_t gn,uint32_t ap,uint32_t an){(void)q;(void)qn;const char*g=(const char*)(uintptr_t)gp;const char*a=(const char*)(uintptr_t)ap;out[0]=score(g,gn,a,an,"ownership");out[1]=score(g,gn,a,an,"upgradeability");out[2]=score(g,gn,a,an,"pause");out[3]=score(g,gn,a,an,"mint");out[4]=(out[0]+out[1]+out[2]+out[3])/4.0f;return out[4];}
__attribute__((export_name("breakdown_answer"))) uint32_t breakdown_answer(uint32_t q,uint32_t qn,uint32_t gp,uint32_t gn,uint32_t ap,uint32_t an){rank_answer(q,qn,gp,gn,ap,an);return (uint32_t)(uintptr_t)out;}
