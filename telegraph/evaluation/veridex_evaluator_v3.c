#include <stdint.h>

/* Veridex v3: deterministic, intent-aware (especially closed-set fraud labels),
   freestanding wasm32 scorer for Telegraph Track 2. */
static uint8_t heap[262144];
static uint32_t heap_top = 65536;
static float breakdown[5];

__attribute__((export_name("alloc")))
uint32_t alloc(uint32_t size) {
    if (size == 0) return 0;
    uint32_t p = (heap_top + 7u) & ~7u;
    if (p > sizeof(heap) || size > sizeof(heap) - p) return 0;
    heap_top = p + size;
    return p;
}

__attribute__((export_name("dealloc")))
void dealloc(uint32_t ptr, uint32_t size) {
    if (size == 0) return;
    uint32_t end = ptr + size;
    if (end == heap_top && ptr >= 65536u && ptr <= sizeof(heap)) heap_top = ptr;
}

static uint8_t lower_ascii(uint8_t c) { return (c >= 'A' && c <= 'Z') ? (uint8_t)(c + 32) : c; }
static int is_space(uint8_t c) { return c==' ' || c=='\n' || c=='\r' || c=='\t'; }
static int is_alpha(uint8_t c) { c=lower_ascii(c); return (c>='a'&&c<='z') || c>=128; }
static int is_digit(uint8_t c) { return c>='0'&&c<='9'; }
static int is_word_char(uint8_t c) { return is_alpha(c) || is_digit(c) || c=='_' || c=='-'; }
static int is_punct(uint8_t c) { return !is_word_char(c); }

static int eq_word(const uint8_t *s, int n, const char *w) {
    int i=0; while (i<n && w[i]) { if (lower_ascii(s[i]) != (uint8_t)w[i]) return 0; i++; }
    return i==n && w[i]=='\0';
}

static int is_stop(const uint8_t *s, int n) {
    static const char *sw[] = {
      "a","an","and","are","as","at","be","been","being","by","can","could",
      "did","do","does","for","from","had","has","have","how","i","if","in","is",
      "it","its","may","might","of","on","or","our","that","the","their","this",
      "to","was","we","were","what","when","where","which","who","why","will","with",
      "would","you","your"
    };
    for (unsigned i=0;i<sizeof(sw)/sizeof(sw[0]);i++) if (eq_word(s,n,sw[i])) return 1;
    return 0;
}

/* Conservative semantic lexicon: high-confidence equivalence/contradiction groups. */
static int group_of(const uint8_t *s, int n) {
    static const char *fraud[] = {"fraud","fraudulent","scam","scammy","phishing","phish","malicious","malware","fake","counterfeit","deceptive","deception","unsafe","dangerous","harmful","attack","attacker","compromised","credential","stolen"};
    static const char *safe[] = {"safe","legitimate","legit","genuine","authentic","benign","trusted","trustworthy","secure","harmless","clean","verified"};
    static const char *positive[] = {"positive","bullish","optimistic","favorable","favourable","upbeat"};
    static const char *negative[] = {"negative","bearish","pessimistic","unfavorable","unfavourable","downbeat"};
    static const char *yes[] = {"yes","true","correct","valid","confirmed","approve","approved"};
    static const char *no[] = {"no","false","incorrect","invalid","denied","reject","rejected"};
    static const char *allow[] = {"allowed","permitted","acceptable","okay","ok"};
    static const char *block[] = {"blocked","forbidden","prohibited","disallowed"};
    static const char *decrease[] = {"reduce","reduced","reduces","reducing","decrease","decreased","decreases","decreasing","lower","lowered","lowers","lowering","fall","fell","falls","falling","drop","dropped","drops","dropping","cut","cutting"};
    static const char *increase[] = {"increase","increased","increases","increasing","raise","raised","raises","raising","higher","rise","rose","rises","rising","grow","grew","grows","growing","boost","boosted","boosts"};
    const char **groups[] = {fraud,safe,positive,negative,yes,no,allow,block,decrease,increase};
    const int counts[] = {19,12,6,6,7,7,5,4,21,20};
    for (int g=0;g<10;g++) for (int i=0;i<counts[g];i++) if (eq_word(s,n,groups[g][i])) return g+1;
    return 0;
}

static int next_token(const uint8_t *s,int n,int *pos,int *st,int *len) {
    int i=*pos;
    while(i<n && !is_word_char(s[i])) i++;
    if(i>=n){*pos=i;return 0;}
    *st=i;
    while(i<n && is_word_char(s[i])) i++;
    *len=i-*st; *pos=i; return 1;
}

static int token_equal(const uint8_t *a,int an,const uint8_t *b,int bn){
    if(an!=bn)return 0; for(int i=0;i<an;i++) if(lower_ascii(a[i])!=lower_ascii(b[i])) return 0; return 1;
}

static int token_count(const uint8_t *s,int n){
    int p=0,st=0,l=0,c=0; while(next_token(s,n,&p,&st,&l)) if(!is_stop(s+st,l)) c++; return c;
}

static int number_count(const uint8_t *s,int n){
    int p=0,st=0,l=0,c=0; while(next_token(s,n,&p,&st,&l)){int has=0;for(int i=0;i<l;i++)if(is_digit(s[st+i])){has=1;break;}if(has)c++;}return c;
}

static int has_number_mismatch(const uint8_t *a,int an,const uint8_t *b,int bn){
    uint8_t da[64],db[64]; int na=0,nb=0;
    for(int i=0;i<an;i++) if(is_digit(a[i]) && na<64) da[na++]=a[i];
    for(int i=0;i<bn;i++) if(is_digit(b[i]) && nb<64) db[nb++]=b[i];
    if(na==0 || nb==0) return 0;
    if(na!=nb) return 1;
    for(int i=0;i<na;i++) if(da[i]!=db[i]) return 1;
    return 0;
}

static int token_in(const uint8_t *s,int n,const uint8_t *target,int tn){
    int p=0,st=0,l=0; while(next_token(s,n,&p,&st,&l)) if(token_equal(s+st,l,target,tn)) return 1; return 0;
}

static int semantic_match(const uint8_t *a,int an,const uint8_t *b,int bn){
    int p=0,st=0,l=0;
    while(next_token(a,an,&p,&st,&l)) {
        if(is_stop(a+st,l)) continue;
        int ga=group_of(a+st,l); if(ga){
            int pb=0,sb=0,lb=0; while(next_token(b,bn,&pb,&sb,&lb)) if(group_of(b+sb,lb)==ga) return 1;
        }
    }
    return 0;
}

static int exact_normalized(const uint8_t *a,int an,const uint8_t *b,int bn){
    int ia=0,ib=0;
    while(ia<an && is_punct(a[ia])) ia++; while(ib<bn && is_punct(b[ib])) ib++;
    int ea=an,eb=bn; while(ea>ia&&is_punct(a[ea-1]))ea--; while(eb>ib&&is_punct(b[eb-1]))eb--;
    if(ea-ia!=eb-ib)return 0;
    for(int i=0;i<ea-ia;i++)if(lower_ascii(a[ia+i])!=lower_ascii(b[ib+i]))return 0;
    return 1;
}

static int contradiction(const uint8_t *gt,int gn,const uint8_t *ans,int an){
    int pg[8]={0},pa[8]={0};
    int p=0,s=0,l=0;
    while(next_token(gt,gn,&p,&s,&l)){int g=group_of(gt+s,l);if(g<=8)pg[g-1]=1;}
    p=0; while(next_token(ans,an,&p,&s,&l)){int g=group_of(ans+s,l);if(g<=8)pa[g-1]=1;}
    static const int opp[][2]={{1,2},{3,4},{5,6},{7,8},{9,10}};
    for(int i=0;i<5;i++) if((pg[opp[i][0]-1]&&pa[opp[i][1]-1])||(pg[opp[i][1]-1]&&pa[opp[i][0]-1])) return 1;
    const char *neg[]={"not","no","never","isn't","isnt","wasn't","wasnt","false"};
    int p1=0,st=0,len=0; while(next_token(gt,gn,&p1,&st,&len)){
        int g=group_of(gt+st,len); if(!g)continue;
        int p2=0,s2=0,l2=0; while(next_token(ans,an,&p2,&s2,&l2)){
            if(group_of(ans+s2,l2)==g) continue;
            for(unsigned z=0;z<sizeof(neg)/sizeof(neg[0]);z++) if(eq_word(ans+s2,l2,neg[z])) return 1;
        }
    }
    return 0;
}

static double parse_number(const uint8_t *s,int n,int *endp){
    int i=0; while(i<n && !is_digit(s[i]) && s[i]!='.') i++;
    if(i>=n) return -1.0;
    double v=0.0; int before=0; while(i<n&&is_digit(s[i])){v=v*10.0+(s[i]-'0');i++;before++;}
    if(i<n&&s[i]=='.'){i++; double place=0.1; while(i<n&&is_digit(s[i])){v+=(s[i]-'0')*place;place*=0.1;i++;}}
    if(endp)*endp=i; return before?v:-1.0;
}
static double number_with_unit(const uint8_t *s,int n){
    int e=0; double v=parse_number(s,n,&e); if(v<0)return -1.0;
    int i=e; while(i<n && is_space(s[i]))i++;
    if(i<n && (s[i]=='k'||s[i]=='K')) return v*1000.0;
    if(i<n && (s[i]=='m'||s[i]=='M')) return v*1000000.0;
    if(i<n && (s[i]=='b'||s[i]=='B')) return v*1000000000.0;
    return v;
}
static int numeric_equivalent(const uint8_t *a,int an,const uint8_t *b,int bn){
    int i=0; double x=-1; while(i<an&&x<0){if(is_digit(a[i]))x=number_with_unit(a+i,an-i);i++;}
    i=0; double y=-1; while(i<bn&&y<0){if(is_digit(b[i]))y=number_with_unit(b+i,bn-i);i++;}
    if(x<0||y<0)return 0; double d=x>y?x-y:y-x; double scale=x>y?x:y; return d <= (scale*0.001 + 0.000001);
}

static int entity_mismatch(const uint8_t *q,int qn,const uint8_t *gt,int gn,const uint8_t *ans,int an){
    int p=0,s=0,l=0;
    while(next_token(ans,an,&p,&s,&l)){
        if(l<2 || ans[s]<'A'||ans[s]>'Z') continue;
        if(!token_in(gt,gn,ans+s,l) && !token_in(q,qn,ans+s,l)) return 1;
    }
    return 0;
}

static float score_text(const uint8_t *q,int qn,const uint8_t *gt,int gn,const uint8_t *ans,int an){
    if(gn<=0||an<=0)return 0.0f;
    if(exact_normalized(gt,gn,ans,an))return 1.0f;
    int gtN=token_count(gt,gn), anN=token_count(ans,an);
    if(gtN<=0||anN<=0)return 0.0f;
    int common=0, sem=0, gt_sig=0, ans_sig=0;
    int p=0,st=0,l=0;
    while(next_token(gt,gn,&p,&st,&l)){
        if(is_stop(gt+st,l))continue;
        gt_sig++;
        int found=0; int pb=0,sb=0,lb=0;
        while(next_token(ans,an,&pb,&sb,&lb)) if(token_equal(gt+st,l,ans+sb,lb)){found=1;break;}
        if(found)common++;
        if(group_of(gt+st,l) && semantic_match(gt+st,l,ans,an)) sem++;
    }
    p=0;while(next_token(ans,an,&p,&st,&l))if(!is_stop(ans+st,l))ans_sig++;
    float overlap=(float)common/(float)(gt_sig>ans_sig?gt_sig:ans_sig);
    float precision=(float)common/(float)ans_sig;
    float recall=(float)common/(float)gt_sig;
    float lexical=0.50f*overlap+0.25f*precision+0.25f*recall;
    float semantic=gt_sig?((float)sem/(float)gt_sig):0.0f;
    float len=(float)(gn<an?gn:an)/(float)(gn>an?gn:an);
    float score=0.50f*lexical+0.30f*semantic+0.20f*len;
    int gtc=0,anc=0;
    p=0;while(next_token(gt,gn,&p,&st,&l))if(group_of(gt+st,l))gtc++;
    p=0;while(next_token(ans,an,&p,&st,&l))if(group_of(ans+st,l))anc++;
    if(gtc>0 && anc>0 && semantic>0.0f) score += 0.16f;
    if(number_count(gt,gn)>0 && number_count(ans,an)>0){
        if(numeric_equivalent(gt,gn,ans,an)) score += 0.10f;
        else if(has_number_mismatch(gt,gn,ans,an)) score *= 0.55f;
    }
    if(entity_mismatch(q,qn,gt,gn,ans,an)) score *= 0.18f;
    if(contradiction(gt,gn,ans,an)) score *= 0.12f;
    if(score>0.999f)score=0.999f;
    if(score<0.0f)score=0.0f;
    return score;
}

__attribute__((export_name("rank_answer")))
float rank_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){
    return score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ma_ptr,(int)ma_len);
}

__attribute__((export_name("breakdown_answer")))
uint32_t breakdown_answer(uint32_t q_ptr,uint32_t q_len,uint32_t gt_ptr,uint32_t gt_len,uint32_t ma_ptr,uint32_t ma_len){
    float s=score_text((const uint8_t*)(uintptr_t)q_ptr,(int)q_len,(const uint8_t*)(uintptr_t)gt_ptr,(int)gt_len,(const uint8_t*)(uintptr_t)ma_ptr,(int)ma_len);
    breakdown[0]=s; breakdown[1]=s; breakdown[2]=s; breakdown[3]=(gt_len>0&&ma_len>0)?((float)(gt_len<ma_len?gt_len:ma_len)/(float)(gt_len>ma_len?gt_len:ma_len)):0.0f; breakdown[4]=s;
    return (uint32_t)(uintptr_t)breakdown;
}
