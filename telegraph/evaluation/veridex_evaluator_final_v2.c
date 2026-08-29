#include <stdint.h>

/*
 * Veridex Track 2 — deterministic FRAUD_DETECTION evaluator.
 * Freestanding wasm32 implementation intentionally kept small and portable.
 * Inputs: query, ground-truth answer, miner answer as UTF-8 byte spans.
 * Output: score in [0,1].
 */
static unsigned char heap[262144];
static uint32_t heap_top = 65536;
static float breakdown[5];

__attribute__((export_name("alloc")))
uint32_t alloc(uint32_t size) {
    if (size == 0 || size > sizeof(heap)) return 0;
    uint32_t p = (heap_top + 7u) & ~7u;
    if (p < 65536u || p > sizeof(heap) || size > sizeof(heap) - p) return 0;
    heap_top = p + size;
    return p;
}

__attribute__((export_name("dealloc")))
void dealloc(uint32_t ptr, uint32_t size) {
    if (!size || ptr < 65536u || ptr + size != heap_top) return;
    heap_top = ptr;
}

static uint8_t lower(uint8_t c) { return (c >= 'A' && c <= 'Z') ? (uint8_t)(c + 32) : c; }
static int word_char(uint8_t c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c=='_' || c=='-'; }
static int space(uint8_t c) { return c==' ' || c=='\n' || c=='\r' || c=='\t'; }
static int digit(uint8_t c) { return c>='0' && c<='9'; }

static int next_word(const uint8_t *s, int n, int *p, int *st, int *ln) {
    int i=*p;
    while (i<n && !word_char(s[i])) i++;
    if (i>=n) { *p=i; return 0; }
    *st=i;
    while (i<n && word_char(s[i])) i++;
    *ln=i-*st; *p=i; return 1;
}

static int eq(const uint8_t *a,int an,const char *b) {
    int i=0; while (i<an && b[i]) { if (lower(a[i])!=(uint8_t)b[i]) return 0; i++; }
    return i==an && b[i]==0;
}

/* Closed-set semantic families used by FRAUD_DETECTION benchmark probes. */
static int family(const uint8_t *s,int n) {
    static const char *fraud[] = {"fraud","fraudulent","scam","phishing","phish","malicious","malware","fake","counterfeit","deceptive","unsafe","dangerous","harmful","compromised","stolen"};
    static const char *safe[] = {"safe","legitimate","legit","genuine","authentic","benign","trusted","trustworthy","secure","harmless","clean","verified"};
    static const char *pos[] = {"positive","bullish","optimistic","favorable","favourable","upbeat"};
    static const char *neg[] = {"negative","bearish","pessimistic","unfavorable","unfavourable","downbeat"};
    static const char *yes[] = {"yes","true","correct","valid","confirmed","approve","approved"};
    static const char *no[] = {"no","false","incorrect","invalid","denied","reject","rejected"};
    static const char *allow[] = {"allowed","permitted","acceptable","okay","ok"};
    static const char *block[] = {"blocked","forbidden","prohibited","disallowed"};
    static const char **gs[] = {fraud,safe,pos,neg,yes,no,allow,block};
    static const int ns[] = {15,12,6,6,7,7,5,4};
    for (int g=0;g<8;g++) for (int i=0;i<ns[g];i++) if (eq(s,n,gs[g][i])) return g+1;
    return 0;
}

static int token_present(const uint8_t *s,int n,const uint8_t *t,int tn) {
    int p=0,st=0,ln=0;
    while (next_word(s,n,&p,&st,&ln)) {
        if (ln==tn) { int ok=1; for(int i=0;i<ln;i++) if(lower(s[st+i])!=lower(t[i])) {ok=0;break;} if(ok) return 1; }
    }
    return 0;
}

static int family_present(const uint8_t *s,int n,int f) {
    int p=0,st=0,ln=0;
    while(next_word(s,n,&p,&st,&ln)) if(family(s+st,ln)==f) return 1;
    return 0;
}

static int contradiction(const uint8_t *gt,int gn,const uint8_t *ans,int an) {
    static const int opp[][2]={{1,2},{3,4},{5,6},{7,8}};
    for(int i=0;i<4;i++) if((family_present(gt,gn,opp[i][0])&&family_present(ans,an,opp[i][1])) || (family_present(gt,gn,opp[i][1])&&family_present(ans,an,opp[i][0]))) return 1;
    return 0;
}

static int exact_norm(const uint8_t *a,int an,const uint8_t *b,int bn) {
    int ia=0,ib=0,ea=an,eb=bn;
    while(ia<ea && (space(a[ia]) || a[ia]=='.' || a[ia]==',' || a[ia]=='!' || a[ia]=='?')) ia++;
    while(ib<eb && (space(b[ib]) || b[ib]=='.' || b[ib]==',' || b[ib]=='!' || b[ib]=='?')) ib++;
    while(ea>ia && (space(a[ea-1]) || a[ea-1]=='.' || a[ea-1]==',' || a[ea-1]=='!' || a[ea-1]=='?')) ea--;
    while(eb>ib && (space(b[eb-1]) || b[eb-1]=='.' || b[eb-1]==',' || b[eb-1]=='!' || b[eb-1]=='?')) eb--;
    if(ea-ia!=eb-ib) return 0;
    for(int i=0;i<ea-ia;i++) if(lower(a[ia+i])!=lower(b[ib+i])) return 0;
    return 1;
}

static int has_digit(const uint8_t *s,int n) { for(int i=0;i<n;i++) if(digit(s[i])) return 1; return 0; }
static int same_digits(const uint8_t *a,int an,const uint8_t *b,int bn) {
    int i=0,j=0,ca=0,cb=0;
    while(i<an){ if(digit(a[i]))ca++; i++; }
    while(j<bn){ if(digit(b[j]))cb++; j++; }
    if(ca!=cb) return 0;
    i=j=0;
    while(i<an || j<bn){
        while(i<an && !digit(a[i]))i++; while(j<bn && !digit(b[j]))j++;
        if(i<an && j<bn && a[i]!=b[j]) return 0;
        if(i<an)i++; if(j<bn)j++;
    }
    return 1;
}

static float score(uint32_t qp,uint32_t qn,uint32_t gp,uint32_t gn,uint32_t ap,uint32_t an) {
    const uint8_t *q=(const uint8_t*)(uintptr_t)qp, *gt=(const uint8_t*)(uintptr_t)gp, *a=(const uint8_t*)(uintptr_t)ap;
    if(gn<=0 || an<=0) return 0.0f;
    if(exact_norm(gt,gn,a,an)) return 1.0f;

    int gt_tokens=0, ans_tokens=0, common=0, sem=0, p=0,st=0,ln=0;
    while(next_word(gt,gn,&p,&st,&ln)){ gt_tokens++; if(family(gt+st,ln)) sem += family_present(a,an,family(gt+st,ln)); }
    p=0; while(next_word(a,an,&p,&st,&ln)) ans_tokens++;
    p=0; while(next_word(gt,gn,&p,&st,&ln)) { int in_p=0,p2=0,s2=0,l2=0; while(next_word(a,an,&p2,&s2,&l2)) {if(l2==ln){in_p=1;for(int i=0;i<ln;i++)if(lower(gt[st+i])!=lower(a[s2+i])){in_p=0;break;}if(in_p)break;}} if(in_p)common++; }
    if(gt_tokens<=0 || ans_tokens<=0) return 0.0f;
    float overlap=(float)common/(float)(gt_tokens>ans_tokens?gt_tokens:ans_tokens);
    float precision=(float)common/(float)ans_tokens;
    float recall=(float)common/(float)gt_tokens;
    float lexical=0.50f*overlap+0.25f*precision+0.25f*recall;
    float semantic=(float)sem/(float)gt_tokens;
    float len=(float)(gn<an?gn:an)/(float)(gn>an?gn:an);
    float v=0.52f*lexical+0.28f*semantic+0.20f*len;

    /* Preserve label polarity and exact numbers where the answer contains them. */
    int gf=0,af=0;
    for(int f=1;f<=8;f++){ if(family_present(gt,gn,f))gf++; if(family_present(a,an,f))af++; }
    if(gf && af) {
        int good=0; for(int f=1;f<=8;f++) if(family_present(gt,gn,f) && family_present(a,an,f)) good++;
        v += 0.18f*(float)good/(float)gf;
    }
    if(has_digit(gt,gn) && has_digit(a,an)) v += same_digits(gt,gn,a,an) ? 0.10f : -0.22f;
    if(contradiction(gt,gn,a,an)) v *= 0.08f;

    /* Penalize answers that introduce obvious capitalized entities absent from GT/query. */
    p=0; while(next_word(a,an,&p,&st,&ln)) if(ln>=2 && a[st]>='A' && a[st]<='Z' && !token_present(gt,gn,a+st,ln) && !token_present(q,qn,a+st,ln)) v*=0.20f;
    if(v<0.0f) v=0.0f; if(v>0.999f) v=0.999f; return v;
}

__attribute__((export_name("rank_answer")))
float rank_answer(uint32_t qp,uint32_t qn,uint32_t gp,uint32_t gn,uint32_t ap,uint32_t an) { return score(qp,qn,gp,gn,ap,an); }

__attribute__((export_name("breakdown_answer")))
uint32_t breakdown_answer(uint32_t qp,uint32_t qn,uint32_t gp,uint32_t gn,uint32_t ap,uint32_t an) {
    float s=score(qp,qn,gp,gn,ap,an);
    breakdown[0]=s; breakdown[1]=s>0.8f?1.0f:0.0f; breakdown[2]=s>0.5f?1.0f:0.0f; breakdown[3]=s; breakdown[4]=0.0f;
    return (uint32_t)(uintptr_t)breakdown;
}
