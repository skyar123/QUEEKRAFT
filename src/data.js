// Win-condition targets. The pools below hold MORE content than this (so runs
// vary), but victory, HUD "x/N" displays, and quest-log bars all read from here.
export const GOALS = { zines: 19, figures: 9 };

export const ZINES = {
    'tucking': { title: 'Safe Tucking Guide', image: '/images/zine_diy.png', content: '<h3>Safe Tucking</h3><p>Medical tape only, never duct tape! Take breaks every 8 hours. Your safety comes first.</p>' },
    'binding': { title: 'Chest Binding Safety', image: '/images/zine_punk.png', content: '<h3>Binding Safety</h3><p>Use proper binders, never ace bandages. Listen to your body. Take breaks.</p>' },
    'hrt': { title: 'HRT Guide', image: '/images/zine_herbal.png', content: '<h3>Hormone Therapy</h3><p>Work with qualified doctors. Informed consent clinics are available. You deserve care.</p>' },
    'legal': { title: 'Legal Rights', image: '/images/zine_abolition.png', content: '<h3>Know Your Rights</h3><p>Title VII protects employment. Laws vary by location. Knowledge is power.</p>' },
    'consent': { title: 'Consent Guide', image: '/images/zine_mutual_aid.png', content: '<h3>Consent & Communication</h3><p>Freely given, informed, enthusiastic, ongoing, specific. Always.</p>' },
    'pronouns': { title: 'Pronoun Guide', image: '/images/zine_queer.png', content: '<h3>Using Pronouns</h3><p>Ask when appropriate, practice consistently, correct mistakes quickly.</p>' },
    'gendertrash': { title: 'gendertrash from hell', image: '/images/zine_punk.png', content: '<h3>Transsexual Resistance</h3><p>"We are not your gender positive genetics, we are your worst nightmare. We are the ones who refuse to disappear quietly."</p>' },
    'faith': { title: 'Faith / Fe', image: '/images/zine_witch.png', content: '<h3>La fuerza de las transiciones</h3><p>Queer love transcends languages, borders, bodies. Fe: believing in tomorrow when today feels impossible.</p>' },
    'landscape': { title: 'First Landscape', image: '/images/zine_appalachia.png', content: '<h3>Tentative Maps</h3><p>"My gender is unmappable. Liminal territories require different instruments: intuition, patience, willingness to get lost."</p>' },
    'godwithin': { title: 'The God Within', image: '/images/zine_history.png', content: '<h3>Black Queerness Across Diaspora</h3><p>"Before they told us we were wrong, we were sacred. Pre-colonial truth: gender was a river, not a wall."</p>' },
    'drrad': { title: 'Dr. RAD\'s Queer Health Show', image: '/images/zine_herbal.png', content: '<h3>DIY Health for Queers</h3><p>"Your body parts don\'t match their medical forms. Good health means being seen as you are, not who they think you should be."</p>' },
    'insurrection': { title: 'Toward the Queerest Insurrection', image: '/images/zine_anarchist.png', content: '<h3>Against Assimilation</h3><p>"Marriage won\'t save us. Only insurrection. Only the complete dismantling of everything that makes them comfortable."</p>' },
    'genderreal': { title: 'is gender real?', image: '/images/zine_art.png', content: '<h3>Philosophical Questions</h3><p>"What do you mean by real? What do you mean by gender? Gender is a construct and so are you. The sound of freedom."</p>' },
    'gaylordphoenix': { title: 'Gaylord Phoenix', image: '/images/zine_art.png', content: '<h3>Queer Mystical Adventure</h3><p>"The gaylord phoenix willing to sacrifice anything for love, for self-knowledge, for the violent beautiful truth of becoming."</p>' },
    'affirmations': { title: 'Authentic Affirmations pt. 3', image: '/images/zine_poetry.png', content: '<h3>Still Here, Still Queer</h3><p>"You are not too much or not enough. You are exactly the right amount of yourself. Your existence is resistance."</p>' },
    'theywalk': { title: 'They Walk', image: '/images/zine_poetry.png', content: '<h3>Nonbinary Identity</h3><p>"They/them/theirs not because I\'m confused but because I\'m clear. Walking toward the family that chooses me back."</p>' },
    'alexlearns': { title: 'Alex Learns about Gender Identity', image: '/images/zine_history.png', content: '<h3>Educational Zine</h3><p>"Gender is not your body, clothes, name, or toys. Gender is YOU. Only you can know what feels right for you."</p>' },
    'euphoria': { title: 'Gender Euphoria', image: '/images/zine_music.png', content: '<h3>Celebrating Trans Joy</h3><p>"Trans nonbinary/genderqueer is not a problem to be solved. It\'s a joy to be celebrated. Euphoria comes in waves."</p>' },
    'menstruation': { title: 'Zine on Menstruation', image: '/images/zine_witch.png', content: '<h3>Questioning Binaries</h3><p>"Not all women menstruate, not all who menstruate are women. Periods ≠ womanhood, bleeding ≠ binary."</p>' },
    'ballroom_legacy': { title: 'Ballroom Legacy', image: '/images/zine_history.png', content: '<h3>Children of the House</h3><p>"The Ballroom gave us what biology denied: mothers who chose us, houses that held us, stages where we were finally crowned. Chosen family is not lesser family — it is the truest kind."</p>' },
    'star_manifesto': { title: 'STAR Manifesto', image: '/images/zine_anarchist.png', content: '<h3>Street Transvestite Action Revolutionaries</h3><p>"STAR was for the street gay people, the people who are radical, the people who wanted change. We were fighting for homeless trans youth when nobody else would. STAR House belonged to us all." — Sylvia Rivera</p>' },
    'trans_motherhood': { title: 'Trans Mothers of the World', image: '/images/zine_queer.png', content: '<h3>Mother is a Verb</h3><p>"From Marsha to Mariela, Crystal to Gauri — trans mothers have raised children the world abandoned. Motherhood is not biology. It is devotion, protection, teaching a child they are loved and worthy of being here."</p>' },
    'chosen_family_guide': { title: 'Building Your Chosen Family', image: '/images/zine_mutual_aid.png', content: '<h3>A Practical Guide</h3><p>"Step 1: Show up. Step 2: Show up again. Step 3: Keep showing up when things get hard. Chosen family is built in crisis and in joy, in shared meals and shared shelters. You earn it by giving it."</p>' },

    // ── DSM-5-TR Mental Health Archive (2022 text revision, current as of 2026) ──
    // Queer and trans people experience mental health conditions at dramatically
    // elevated rates due to minority stress — not inherent pathology. These zines
    // name the terrain so no one has to wander through it alone.
    'dsm_mdd': { title: 'Major Depressive Disorder', image: '/images/zine_herbal.png', content: '<h3>Major Depressive Disorder (DSM-5-TR)</h3><p>5+ symptoms for at least 2 weeks — must include depressed mood OR anhedonia: depressed mood most of the day; loss of interest or pleasure; weight or appetite change; insomnia or hypersomnia; psychomotor agitation or slowing; fatigue; worthlessness or excessive guilt; poor concentration; recurrent thoughts of death or suicidal ideation. LGBTQ+ people experience MDD at 2–3x the rate of cisgender peers — the result of minority stress, discrimination, and family rejection, not inherent pathology. Evidence-based treatments: CBT, IPT, antidepressants (SSRIs/SNRIs), ketamine-assisted therapy, affirming psychotherapy. You deserve care that sees all of you.</p>' },
    'dsm_bipolar': { title: 'Bipolar & Related Disorders', image: '/images/zine_poetry.png', content: '<h3>Bipolar & Related Disorders (DSM-5-TR)</h3><p><strong>Bipolar I:</strong> at least 1 manic episode — elevated, expansive, or irritable mood plus increased energy for 7+ days, with 3+ of: grandiosity, decreased sleep need, pressured speech, racing thoughts, distractibility, increased goal-directed activity, reckless behavior. <strong>Bipolar II:</strong> at least 1 hypomanic episode (same criteria, 4+ days, no hospitalization) plus at least 1 major depressive episode; never a full manic episode. <strong>Cyclothymic Disorder:</strong> 2+ years of hypomanic and depressive periods not meeting full episode criteria, absent no more than 2 months. Misdiagnosis is common — queer AFAB people are frequently labeled BPD instead of Bipolar. Mood stabilizers (lithium, lamotrigine, valproate), atypical antipsychotics, and psychotherapy are first-line. Second opinions are valid and often necessary.</p>' },
    'dsm_anxiety': { title: 'Anxiety Disorders', image: '/images/zine_punk.png', content: '<h3>Anxiety Disorders (DSM-5-TR)</h3><p><strong>GAD:</strong> Excessive, difficult-to-control worry across multiple domains for 6+ months, with 3+ of: restlessness, fatigue, poor concentration, irritability, muscle tension, sleep disturbance. <strong>Panic Disorder:</strong> Recurrent unexpected panic attacks (4+ symptoms: palpitations, sweating, trembling, shortness of breath, chest pain, nausea, dizziness, derealization, fear of dying, numbness) plus 1+ month of anticipatory concern or avoidance. <strong>Social Anxiety Disorder:</strong> Intense fear of scrutiny in social situations for 6+ months. <strong>Agoraphobia:</strong> Fear or avoidance in 2+ types of public situation for 6+ months. <strong>Separation Anxiety Disorder, Selective Mutism, Specific Phobia</strong> also recognized. For queer people, anxiety often begins as rational hypervigilance in hostile environments. This is not weakness — it is adaptation. Evidence-based: CBT, exposure therapy, SSRIs/SNRIs, affirming therapy.</p>' },
    'dsm_ocd': { title: 'OCD & Related Disorders', image: '/images/zine_diy.png', content: '<h3>OCD & Related Disorders (DSM-5-TR)</h3><p><strong>OCD:</strong> Obsessions (recurrent, intrusive, distressing thoughts or urges) AND/OR compulsions (repetitive behaviors to reduce distress) — time-consuming (more than 1 hr/day) or causing significant impairment. Insight ranges from good to absent. <strong>Body Dysmorphic Disorder:</strong> Preoccupation with perceived flaws not observable to others; repetitive behaviors like mirror-checking or reassurance-seeking; not explained by eating disorder concerns. <strong>Hoarding Disorder:</strong> Persistent difficulty discarding possessions; significant clutter. <strong>Trichotillomania:</strong> Recurrent hair pulling causing hair loss. <strong>Excoriation Disorder:</strong> Recurrent skin picking causing lesions. OCD can manifest as SOCD (sexual orientation OCD) or gender-focused intrusive thoughts — affirming therapists distinguish pathological intrusion from genuine exploration. First-line treatment: ERP (Exposure and Response Prevention), SSRIs.</p>' },
    'dsm_trauma': { title: 'Trauma & PTSD', image: '/images/zine_history.png', content: '<h3>Trauma & Stressor-Related Disorders (DSM-5-TR)</h3><p><strong>PTSD:</strong> Exposure to actual or threatened death, serious injury, or sexual violence — then 1+ intrusion symptom (flashbacks, nightmares, intrusive memories), 1+ avoidance symptom, 2+ negative cognition or mood changes, 2+ hyperarousal symptoms. Duration more than 1 month. Significant impairment. <strong>Acute Stress Disorder:</strong> Same criteria, duration 3 days to 1 month post-trauma. <strong>Adjustment Disorder:</strong> Emotional or behavioral symptoms disproportionate to an identifiable stressor within 3 months. <strong>Reactive Attachment Disorder, Disinhibited Social Engagement Disorder</strong> also in this chapter. Trans people routinely face PTSD-qualifying events: violence, conversion therapy, medical gatekeeping, family rejection, housing loss. Treatments: CPT, Prolonged Exposure, EMDR, trauma-informed DBT. Trauma-informed care is not optional — it is mandatory for working with trans communities.</p>' },
    'dsm_complex_trauma': { title: 'Complex Trauma (ICD-11)', image: '/images/zine_abolition.png', content: '<h3>Complex PTSD — ICD-11 (2022), not yet in DSM-5-TR</h3><p>CPTSD is recognized in ICD-11 but absent from DSM-5-TR — a gap the field openly acknowledges. It describes the aftermath of prolonged, repeated trauma from which escape was difficult or impossible: childhood abuse, captivity, institutional violence, sustained persecution. CPTSD includes all PTSD criteria PLUS disturbances in self-organization — affect dysregulation (emotional volatility, explosive or inhibited anger, self-destructive responses to distress); negative self-concept (persistent beliefs of worthlessness, defeat, or permanent damage); and relationship difficulties (avoidance of relationships, persistent sense of disconnection from others). Trans people who survived hostile homes, conversion therapy, or years of medical gatekeeping frequently meet CPTSD criteria. The diagnosis validates that the harm was systemic and sustained — not a personal failing. Treatment is phase-based: safety and stabilization first, then trauma processing, then integration. Recovery is real.</p>' },
    'dsm_dissociation': { title: 'Dissociative Disorders', image: '/images/zine_art.png', content: '<h3>Dissociative Disorders (DSM-5-TR)</h3><p><strong>Dissociative Identity Disorder (DID):</strong> 2+ distinct identity states; recurrent gaps in recall of everyday events, personal information, or traumatic memories; significant distress or impairment. Caused by overwhelming early trauma — not a media invention. <strong>Depersonalization/Derealization Disorder:</strong> Persistent or recurrent experiences of feeling detached from the mind or body (depersonalization) or unreality of surroundings (derealization); reality testing remains intact; causing significant distress. <strong>Dissociative Amnesia:</strong> Inability to recall autobiographical information, usually traumatic — may include purposeful travel or wandering (dissociative fugue). Dissociation is a protective response to overwhelming experience. Trans people who performed a false self for years to survive may develop dissociative patterns without a single acute event. Grounding techniques, trauma-informed therapy, and affirming support are key. You adapted to survive. That is not a flaw — it is evidence of resilience.</p>' },
    'dsm_eating': { title: 'Eating & Feeding Disorders', image: '/images/zine_mutual_aid.png', content: '<h3>Feeding & Eating Disorders (DSM-5-TR)</h3><p><strong>Anorexia Nervosa:</strong> Restriction of energy intake leading to significantly low body weight; intense fear of weight gain; disturbed experience of body weight or shape. Restricting or binge-eating/purging subtypes. <strong>Bulimia Nervosa:</strong> Recurrent binge eating plus compensatory behaviors (purging, fasting, excessive exercise) at least 1x/week for 3+ months; self-evaluation dominated by body shape and weight. <strong>Binge Eating Disorder:</strong> Recurrent binge episodes with loss of control at least 1x/week for 3+ months; marked distress; no regular compensatory behaviors. <strong>ARFID:</strong> Avoidant or restrictive food intake without body image disturbance — sensory, fear-based, or low-interest type. Also recognized: Pica, Rumination Disorder. Trans people experience significantly elevated eating disorder rates — often undetected by providers. Affirming treatment integrates gender-affirming care. Recovery is possible.</p>' },
    'dsm_sleep': { title: 'Sleep-Wake Disorders', image: '/images/zine_witch.png', content: '<h3>Sleep-Wake Disorders (DSM-5-TR)</h3><p><strong>Insomnia Disorder:</strong> Dissatisfaction with sleep quality or quantity (difficulty initiating, maintaining, or returning to sleep) 3+ nights/week for 3+ months, despite adequate opportunity, causing impairment. <strong>Hypersomnolence Disorder:</strong> Excessive sleepiness despite 7+ hours of sleep 3+ times/week for 3+ months. <strong>Narcolepsy:</strong> Recurrent irrepressible sleep episodes plus cataplexy or hypocretin-1 deficiency or characteristic PSG findings. <strong>Nightmare Disorder:</strong> Recurrent frightening dreams causing distress or impairment on awakening. Also recognized: Obstructive Sleep Apnea, REM Sleep Behavior Disorder, Restless Legs Syndrome, Circadian Rhythm Sleep-Wake Disorders, Non-REM Sleep Arousal Disorders (sleepwalking, sleep terrors). Trans people experience significantly elevated insomnia rates due to anxiety, hypervigilance, and dysphoria. HRT often improves sleep architecture. CBT-I (CBT for Insomnia) is more effective long-term than sleep medications. You deserve rest.</p>' },
    'dsm_personality': { title: 'Personality Disorders', image: '/images/zine_appalachia.png', content: '<h3>Personality Disorders (DSM-5-TR)</h3><p><strong>Cluster A:</strong> Paranoid PD (pervasive distrust), Schizoid PD (social detachment, restricted emotional expression), Schizotypal PD (discomfort in close relationships, cognitive or perceptual distortions, eccentric behavior). <strong>Cluster B:</strong> Antisocial PD (disregard for the rights of others, deceit, impulsivity — requires Conduct Disorder history before age 15), Borderline PD (instability of self-image, affect, and relationships; impulsivity; self-harm), Histrionic PD (excessive emotionality, attention-seeking), Narcissistic PD (grandiosity, need for admiration, lack of empathy). <strong>Cluster C:</strong> Avoidant PD (social inhibition, feelings of inadequacy, hypersensitivity to criticism), Dependent PD (excessive need to be cared for), OCPD (preoccupation with orderliness, perfectionism, control — distinct from OCD). Personality disorders are stable, pervasive patterns causing significant impairment — not moral failures. They are overdiagnosed in queer patients when clinicians pathologize identity exploration. Diagnosis requires ruling out cultural and subcultural context. ICD-11 has moved to dimensional trait-based conceptualization. DBT, schema therapy, and MBT are evidence-based.</p>' },
    'dsm_bpd_queer': { title: 'BPD & Queer Experience', image: '/images/zine_anarchist.png', content: '<h3>Borderline Personality Disorder & Queer Experience (DSM-5-TR)</h3><p>BPD criteria: 5+ of 9 — frantic efforts to avoid abandonment; unstable and intense relationships alternating between idealization and devaluation; identity disturbance (unstable self-image or sense of self); impulsivity in 2+ self-damaging areas; recurrent suicidality or self-harm; emotional instability due to marked mood reactivity; chronic feelings of emptiness; inappropriate intense anger or difficulty controlling anger; transient stress-related paranoid ideation or dissociation. BPD is disproportionately diagnosed in trans women and queer AFAB people — often when queerness or trauma responses are being pathologized. Identity exploration is not identity disturbance. Intense feelings about genuine mistreatment are not "inappropriate anger." Affirming providers assess cross-situational pattern and duration. ICD-11 uses dimensional trait-based personality conceptualization instead of the Cluster system. Gold-standard treatment: DBT (Mindfulness, Distress Tolerance, Emotion Regulation, Interpersonal Effectiveness). DBT was created by Dr. Marsha Linehan, who has spoken publicly about her own experience with severe mental illness.</p>' },
    'dsm_schizophrenia': { title: 'Schizophrenia Spectrum', image: '/images/zine_history.png', content: '<h3>Schizophrenia Spectrum Disorders (DSM-5-TR)</h3><p><strong>Schizophrenia:</strong> 2+ of the following for 1+ month (1+ must be from the first 3): delusions, hallucinations, disorganized speech, grossly disorganized or catatonic behavior, negative symptoms (diminished emotional expression, avolition, alogia, anhedonia, asociality). Continuous disturbance for 6+ months. Significant functional impairment. <strong>Schizoaffective Disorder:</strong> Schizophrenia criteria plus major mood episode, with 2+ weeks of psychotic symptoms without prominent mood symptoms. <strong>Schizophreniform Disorder:</strong> Schizophrenia criteria, duration 1–6 months. <strong>Brief Psychotic Disorder:</strong> 1+ positive symptom lasting 1 day to 1 month, with full return to premorbid functioning. <strong>Delusional Disorder:</strong> 1+ non-bizarre delusion for 1+ month; functioning otherwise preserved. Psychosis has been historically weaponized against queer people as a tool of pathologization and institutionalization. Being trans is not psychosis. Treatment: antipsychotic medications, CBT for psychosis (CBTp), supported employment and housing. Recovery is the norm, not the exception.</p>' },
    'dsm_neurodevelopmental': { title: 'NeuroQueer: ADHD & Autism', image: '/images/zine_diy.png', content: '<h3>Neurodevelopmental Disorders (DSM-5-TR)</h3><p><strong>ADHD:</strong> 6+ inattentive symptoms (adults: 5+) — fails to give close attention, difficulty sustaining focus, does not seem to listen, does not follow through, disorganized, avoids sustained mental effort, loses things, easily distracted, forgetful — AND/OR 6+ hyperactive-impulsive symptoms (fidgets, leaves seat, runs or climbs, cannot play quietly, always "on the go," talks excessively, blurts answers, difficulty waiting, interrupts). Present before age 12, in 2+ settings, causing impairment. Subtypes: Inattentive, Hyperactive-Impulsive, Combined. <strong>Autism Spectrum Disorder (ASD):</strong> Persistent deficits in social communication and interaction across contexts, plus 2+ restricted or repetitive behaviors (stereotyped movements, insistence on sameness, highly restricted interests, sensory hyper- or hypo-reactivity). Present in early developmental period. Also recognized: Intellectual Disability, Communication Disorders, Specific Learning Disorder, Motor Disorders including Tourette Syndrome. LGBTQ+ people are significantly more likely to be autistic or have ADHD. Trans people have 3–6x the ASD rates of cisgender populations. Masking shares mechanisms with closeting. Late diagnosis is common, especially in AFAB people.</p>' },
    'dsm_gender_dysphoria': { title: 'Gender Dysphoria in DSM', image: '/images/zine_queer.png', content: '<h3>Gender Dysphoria (DSM-5-TR 2022)</h3><p>Gender Dysphoria is retained in DSM-5-TR not as a pathologizing label but to ensure access to gender-affirming medical care through insurance coverage. Being trans is not the disorder — dysphoria is the distress caused when gender is unaffirmed in a world that refuses to affirm it. <strong>Adult and Adolescent criteria:</strong> Marked incongruence between experienced or expressed gender and assigned gender for 6+ months, with 2+ of: incongruence between experienced gender and primary or secondary sex characteristics; strong desire to be rid of primary or secondary sex characteristics; strong desire for the sex characteristics of another gender; strong desire to be another gender; strong desire to be treated as another gender; strong conviction of having the feelings and reactions of another gender. Plus significant distress or functional impairment. The ICD-11 (2022) has moved "Gender Incongruence" entirely out of the mental disorders chapter. DSM-6 is expected to follow. Gender-affirming care dramatically reduces dysphoria. Trans youth with affirming environments show mental health outcomes comparable to cisgender peers.</p>' },
    'dsm_substance': { title: 'Substance Use Disorders', image: '/images/zine_mutual_aid.png', content: '<h3>Substance Use Disorders (DSM-5-TR)</h3><p>DSM-5-TR integrates abuse and dependence into Substance Use Disorder (SUD), rated Mild (2–3 criteria), Moderate (4–5), or Severe (6+) across 11 criteria: taking more or for longer than intended; persistent desire or failed attempts to cut down; great deal of time spent; craving; failure to fulfill major role obligations; continued use despite social or interpersonal problems; activities given up; recurrent use in hazardous situations; continued use despite knowing harm; tolerance; withdrawal. Substances covered: Alcohol, Cannabis, Phencyclidine, Other Hallucinogens, Inhalants, Opioids, Sedative/Hypnotic/Anxiolytics, Stimulants (cocaine, amphetamines), Tobacco, Other/Unknown substances. Gambling Disorder is the only recognized non-substance addictive disorder. LGBTQ+ people use substances at significantly higher rates than cisgender heterosexual peers — driven by minority stress, not character. Harm reduction is valid healthcare. Queer-affirming addiction treatment exists and achieves better outcomes. Recovery does not require hiding who you are.</p>' },
    'dsm_somatic': { title: 'Somatic Symptom Disorders', image: '/images/zine_herbal.png', content: '<h3>Somatic Symptom & Related Disorders (DSM-5-TR)</h3><p><strong>Somatic Symptom Disorder:</strong> 1+ somatic symptom causing significant distress, plus excessive thoughts, feelings, or behaviors related to the symptom (disproportionate concern, high health anxiety, excessive time devoted to health). Typically persistent (6+ months). <strong>Illness Anxiety Disorder:</strong> Preoccupation with having or acquiring a serious illness; somatic symptoms absent or mild; high health anxiety; excessive health-related checking or maladaptive avoidance for 6+ months. <strong>Conversion Disorder (Functional Neurological Symptom Disorder):</strong> 1+ symptom of altered voluntary motor or sensory function; clinical findings incompatible with recognized neurological conditions. <strong>Psychological Factors Affecting Other Medical Conditions</strong> and <strong>Factitious Disorder</strong> also recognized. Trans and queer people have complex somatic experiences — chronic pain from binding or tucking, medical trauma from gatekeeping, and the physical experience of dysphoria all blur traditional distinctions. Body-based trauma approaches (somatic experiencing, EMDR, movement therapy) are important complements to talk therapy.</p>' },
    'dsm_grief_pgd': { title: 'Prolonged Grief Disorder', image: '/images/zine_poetry.png', content: '<h3>Prolonged Grief Disorder — New in DSM-5-TR (2022)</h3><p>Added to DSM-5-TR in 2022: after the death of someone close, 12+ months later (6+ months for children and adolescents), the bereaved experiences intense yearning or longing for the deceased on most days or to a disabling degree, PLUS 3+ of 8 symptoms: identity disruption since the death; marked disbelief about the death; avoidance of reminders of the loss; intense emotional pain (anger, bitterness, sorrow); difficulty reengaging with activities or relationships; emotional numbness; feeling that life is meaningless without the deceased; intense loneliness. Causing significant impairment. Queer communities have experienced catastrophic sustained grief: the AIDS crisis (over 100,000 US deaths), ongoing anti-trans violence, and members lost to suicide from minority stress. LGBTQ+ people frequently face disenfranchised grief — for losses the broader world does not acknowledge as valid (chosen family, unrecognized relationships). You do not need to earn your grief. Community grief is real grief. Evidence-based treatment: Prolonged Grief Disorder Treatment (PGDT).</p>' },
    'dsm_minority_stress': { title: 'Minority Stress & Mental Health', image: '/images/zine_abolition.png', content: '<h3>Minority Stress & Mental Health (2026)</h3><p>The Minority Stress Model (Ilan Meyer, 1995/2003) explains the elevated mental health burden in LGBTQ+ populations. Distal stressors (external): discrimination events, victimization, violence, legal exclusion. Proximal stressors (internalized): stigma awareness, expectations of rejection, concealment, internalized homophobia or transphobia. Both act on the body through sustained stress pathways and compound each other over time. 2026 data: trans people experience depression at 4x, anxiety at 3x, and PTSD at 2x the rates of cisgender populations. 41% of trans adults report serious psychological distress (USTS 2022). These statistics reflect hostile environments — not inherent pathology. When environments become affirming, rates normalize dramatically. Psychiatric diagnosis without minority stress context pathologizes survival. Advocacy, community, chosen family, and systemic change are mental healthcare — and so are SSRIs, DBT, and affirming therapy. The goal is not to help people cope better with oppression. It is to transform the conditions that make coping necessary.</p>' },
    'dsm_disruptive': { title: 'Disruptive & Conduct Disorders', image: '/images/zine_punk.png', content: '<h3>Disruptive, Impulse-Control & Conduct Disorders (DSM-5-TR)</h3><p><strong>Oppositional Defiant Disorder:</strong> 4+ symptoms of angry or irritable mood (loses temper, easily annoyed, angry or resentful) and/or argumentative or defiant behavior (argues with authority figures, defies rules, deliberately annoys others, blames others) and/or vindictiveness. 6+ months, affecting at least one non-sibling individual. <strong>Intermittent Explosive Disorder:</strong> Recurrent behavioral outbursts grossly disproportionate to provocation — 2x/week for 3+ months (verbal or minor physical) or 3+ instances causing damage or injury in 12 months. <strong>Conduct Disorder:</strong> Repetitive violation of the rights of others across 4 categories: aggression to people or animals, destruction of property, deceitfulness or theft, serious rule violations. 3+ criteria in the past 12 months, 1+ in the past 6 months. Also recognized: Antisocial Personality Disorder (adults), Pyromania, Kleptomania. Queer youth — especially trans girls and BIPOC queer youth — are disproportionately diagnosed with ODD and CD when expressing survival responses to hostile, invalidating environments. Misdiagnosis funnels queer youth into punitive systems instead of affirming care.</p>' },
    'dsm_neurocognitive': { title: 'Neurocognitive Disorders', image: '/images/zine_history.png', content: '<h3>Neurocognitive Disorders (DSM-5-TR)</h3><p><strong>Major NCD (Dementia):</strong> Significant cognitive decline in 1+ domain (complex attention, executive function, learning and memory, language, perceptual-motor, social cognition); deficits interfere with everyday activities; not exclusively occurring during delirium. Etiologies: Alzheimer\'s disease, Lewy body disease, frontotemporal degeneration, vascular disease, traumatic brain injury, HIV, Parkinson\'s disease, Huntington\'s disease, prion disease, substances or medications. <strong>Mild NCD:</strong> Modest cognitive decline not yet interfering with independence; frequently progresses to major NCD. <strong>Delirium:</strong> Disturbance in attention and awareness developing over hours to days, fluctuating throughout the day, with additional cognitive disturbance attributable to a medical condition, substance, or withdrawal. LGBTQ+ elders face unique risks: social isolation without traditional family support structures, unrecognized chosen-family relationships in institutional care settings, and risk of losing fought-for identity when unable to self-advocate. Affirming dementia care — maintaining correct names and pronouns for someone who cannot advocate for themselves — is a civil rights issue for aging queer communities.</p>' }
};

export const HISTORICAL_FIGURES = {
    'eleanor': { 
        name: 'Eleanor Rykener', 
        era: '14th Century',
        dialogue: {
            greeting: {
                text: "Greetings, young revolutionary. I am Eleanor Rykener, from 14th century London. They tried to erase me, to reduce me to their rigid categories. But I persisted.",
                choices: [
                    { text: "How did you survive?", next: "survive" },
                    { text: "I'm fighting too.", next: "fighting" }
                ]
            },
            survive: {
                text: "By living. Even in medieval times, we existed. We have always existed, defying their narrow world.",
                choices: [
                    { text: "Thank you for being here.", next: "farewell" }
                ]
            },
            fighting: {
                text: "Remember: your authenticity is not a modern invention. It is ancient, sacred, and unbreakable.",
                choices: [
                    { text: "I won't forget.", next: "farewell" }
                ]
            },
            farewell: {
                text: "Walk in strength. Here is a token of our shared history.",
                reward: 'item_history',
                choices: []
            }
        },
        fact: "Eleanor Rykener was a 14th-century individual in London who worked as an embroiderer and barmaid, and lived openly as a woman, challenging medieval gender norms."
    },
    'marsha': { 
        name: 'Marsha P. Johnson', 
        era: 'Late 20th Century',
        dialogue_variants: {
            1: 'greeting',
            3: 'greeting_run3',
            7: 'greeting_run7',
            10: 'greeting_run10'
        },
        dialogue: {
            greeting: {
                text: "Hey honey! Marsha P. Johnson—the P stands for Pay It No Mind! You look like you're carrying the weight of the world.",
                choices: [
                    { text: "I'm trying to save our history.", next: "mission" },
                    { text: "I'm tired. So tired.", next: "tired" }
                ]
            },
            mission: {
                text: "That's beautiful, baby. History is just stories we refuse to let die. Here—take this. *hands you a brick from Stonewall*",
                reward: "item_brick",
                choices: [
                    { text: "Thank you. I won't let you down.", next: "farewell" }
                ]
            },
            tired: {
                text: "*pulls you into a hug* I know, honey. I know. But you're still here. That's revolution enough for today.",
                effect: "heal_full",
                choices: [
                    { text: "Thank you. I feel better.", next: "farewell" }
                ]
            },
            farewell: {
                text: "Pay them no mind, honey! Keep fighting!",
                choices: []
            },
            greeting_run3: {
                text: "You're back! I knew you had fight in you. Your grandmother came through here once. She had your jaw.",
                choices: [
                    { text: "She did? What was she like?", next: "run3_desc" }
                ]
            },
            run3_desc: {
                text: "Fierce. Unstoppable. Just like you. Take this—it belonged to her generation.",
                reward: "item_brick",
                choices: [
                    { text: "I'll make her proud.", next: "farewell" }
                ]
            },
            greeting_run7: {
                text: "Oh honey, you look exhausted. Come here. Even warriors need to rest. We fought so you wouldn't have to fight this hard.",
                effect: "heal_full",
                choices: [
                    { text: "I'm not giving up.", next: "run7_desc" }
                ]
            },
            run7_desc: {
                text: "I know you're not. That's the beauty of it. The fire never dies, it just gets passed along.",
                choices: [
                    { text: "Thank you, Marsha.", next: "farewell" }
                ]
            },
            greeting_run10: {
                text: "Look at you! A true queen of the wasteland. You're not just surviving anymore, you're thriving. We are peers now, honey.",
                reward: "item_brick",
                choices: [
                    { text: "I couldn't have done it without you.", next: "farewell" }
                ]
            }
        },
        fact: "Marsha P. Johnson was a key figure in the 1969 Stonewall uprising and co-founded STAR (Street Transvestite Action Revolutionaries) to support homeless queer youth."
    },
    'sylvia': {
        name: 'Sylvia Rivera',
        era: 'Late 20th Century',
        dialogue: {
            greeting: {
                text: "Sylvia Rivera speaking. I threw the second Molotov cocktail at Stonewall - it was the revolution!",
                choices: [
                    { text: "We're still fighting.", next: "fighting" },
                    { text: "Teach me how to fight.", next: "teach" }
                ]
            },
            fighting: {
                text: "If it wasn't for the drag queen, there would be no gay liberation movement. We're the front-liners!",
                choices: [{text: "We won't let them push us out.", next: "farewell"}]
            },
            teach: {
                text: "We have to be visible. We are not ashamed of who we are. Here, take this rage and use it.",
                reward: "ability_rage",
                choices: [{text: "I'll make it count.", next: "farewell"}]
            },
            farewell: {
                text: "Liberation means ALL of us.",
                choices: []
            }
        },
        fact: "Sylvia Rivera co-founded STAR with Marsha P. Johnson and was the first transgender activist to have her portrait hung in the National Portrait Gallery."
    },
    'dora': { 
        name: 'Dora Richter', 
        era: 'Early 20th Century',
        dialogue: {
            greeting: {
                text: "I am Dora Richter. In 1931, I became the first trans woman to receive successful gender-affirming surgery.",
                choices: [{text: "That must have been terrifying.", next: "science"}]
            },
            science: {
                text: "Dr. Hirschfeld's Institute was my sanctuary. We gave our bodies to science to live as the people we wanted to be.",
                choices: [{text: "Your courage lives on.", next: "farewell"}]
            },
            farewell: {
                text: "Every surgery, every experiment laid the groundwork for future generations like yourself.",
                choices: []
            }
        },
        fact: "Dora Richter was one of the first people in modern history to undergo complete gender-affirming surgery at Magnus Hirschfeld's Institute for Sexual Science in 1931."
    },
    'alan': { 
        name: 'Dr. Alan L. Hart', 
        era: 'Early 20th Century',
        dialogue: {
            greeting: {
                text: "Dr. Alan Hart at your service. Physician, radiologist, and one of the first trans men to undergo surgery in America.",
                choices: [
                    {text: "Tell me about your work.", next: "work"},
                    {text: "I need healing.", next: "heal"}
                ]
            },
            work: {
                text: "I helped save countless lives detecting tuberculosis with X-rays, but society wouldn't let me save my own.",
                choices: [{text: "We see you now.", next: "farewell"}]
            },
            heal: {
                text: "Each of us must work out for ourselves a sensible evaluation of our personalities and accomplishments. Let me tend to your wounds.",
                effect: "heal_full",
                choices: [{text: "Thank you, doctor.", next: "farewell"}]
            },
            farewell: {
                text: "Stay safe out there.",
                choices: []
            }
        },
        fact: "Dr. Alan Hart pioneered the use of X-ray photography to detect tuberculosis, saving countless lives while living authentically as a trans man in the early 20th century."
    },
    'charley': { 
        name: 'Charley Parkhurst', 
        era: '19th Century',
        dialogue: {
            greeting: {
                text: "Howdy there! Charley Parkhurst's the name. Best stagecoach driver in all of California, they said.",
                choices: [{text: "A stagecoach driver?", next: "driver"}]
            },
            driver: {
                text: "Nobody knew I was trans until after I died - lived my whole life as the man I was. Sometimes survival means keeping your truth close.",
                choices: [{text: "I'll remember that.", next: "farewell"}]
            },
            farewell: {
                text: "I found freedom on the frontier, where a person could reinvent themselves completely. Go find yours.",
                choices: []
            }
        },
        fact: "Charley Parkhurst was a famous stagecoach driver who lived as a man for decades and was the first person assigned female at birth to register to vote in a U.S. presidential election (1868)."
    },
    'lili': { 
        name: 'Lili Elbe', 
        era: 'Early 20th Century',
        dialogue: {
            greeting: {
                text: "I am Lili Elbe, Danish painter. My journey was like swimming against the current, up over a waterfall - no turning back.",
                choices: [{text: "You paved the way.", next: "art"}]
            },
            art: {
                text: "I didn't want to be a phenomenon... I wanted to be a quite normal and ordinary woman. Take my artistic vision.",
                reward: "ability_vision",
                choices: [{text: "Thank you.", next: "farewell"}]
            },
            farewell: {
                text: "Even though I died young, I lived authentically. Sometimes that is revolution enough.",
                choices: []
            }
        },
        fact: "Lili Elbe was a successful Danish painter and one of the earliest documented recipients of gender-affirming surgery, which inspired the book and film 'The Danish Girl'."
    },
    'christine': { 
        name: 'Christine Jorgensen', 
        era: 'Mid 20th Century',
        dialogue: {
            greeting: {
                text: "Hello, dear. Christine Jorgensen here. I was the first American to publicly transition.",
                choices: [{text: "The visibility must have been hard.", next: "visibility"}]
            },
            visibility: {
                text: "Visibility has a price, but it also opens doors. Sometimes we must be the lightning rod.",
                choices: [{text: "I will be brave.", next: "farewell"}]
            },
            farewell: {
                text: "The body should fit the soul, not vice versa.",
                choices: []
            }
        },
        fact: "Christine Jorgensen became an international media sensation in 1952 as the first American to publicly transition, using her platform to advocate for transgender visibility."
    },
    'lucy': {
        name: 'Lucy Hicks Anderson',
        era: 'Mid 20th Century',
        dialogue: {
            greeting: {
                text: "Lucy Hicks Anderson, pleased to meet you. I defied any doctor in the world to prove that I am not a woman.",
                choices: [{text: "You are an inspiration.", next: "fight"}]
            },
            fight: {
                text: "As a Black trans woman, I faced the intersection of racism and transphobia, but I never backed down.",
                choices: [{text: "We won't back down either.", next: "farewell"}]
            },
            farewell: {
                text: "Marriage equality, the right to exist - these are battles we must win for every generation.",
                choices: []
            }
        },
        fact: "Lucy Hicks Anderson was a Black trans socialite who fiercely defended her right to live and marry as a woman, stating: 'I defy any doctor in the world to prove that I am not a woman.'"
    },
    'peyton_oconner': {
        name: "Peyton O'Connor",
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "They tried to silence us at the school board... but protecting our children isn't political — it's survival.",
                choices: [
                    { text: "What happened?", next: "story" },
                    { text: "You're still here.", next: "resilience" }
                ]
            },
            story: {
                text: "First openly trans member of the Asheville Board of Education. Mother of two. They harassed us until I resigned. But they couldn't erase what we built.",
                choices: [{ text: "Your children are lucky to have you.", next: "farewell" }]
            },
            resilience: {
                text: "They can force a resignation. They cannot force silence. Every parent here knows the truth: trans kids deserve to live, to learn, to be seen.",
                choices: [{ text: "We'll keep fighting for them.", next: "farewell" }]
            },
            farewell: {
                text: "Protect our children. That's all any of us ever wanted.",
                reward: 'item_shield',
                choices: []
            }
        },
        fact: "Peyton O'Connor was the first openly transgender member of the Asheville City Schools Board of Education and a mother of two, who faced sustained harassment campaigns before resigning."
    },
    'allison_scott': {
        name: 'Allison Scott',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "They grabbed my body to prove I wasn't real. But I'm still here. Still fighting. Still mothering.",
                choices: [
                    { text: "Who are you?", next: "identity" },
                    { text: "That takes real courage.", next: "courage" }
                ]
            },
            identity: {
                text: "Allison Scott. CSE Director, trans mother, fierce advocate. They thought touching me would diminish me. It made me louder.",
                choices: [{ text: "What keeps you going?", next: "courage" }]
            },
            courage: {
                text: "My children. Every trans child who needs to see an adult standing firm. We don't disappear. We bloom.",
                reward: 'item_bloom',
                choices: [{ text: "Thank you. I'll carry this forward.", next: "farewell" }]
            },
            farewell: {
                text: "Keep blooming, even when they try to cut you down.",
                choices: []
            }
        },
        fact: "Allison Scott is a CSE Director, trans mother, and community advocate who has spoken publicly about facing physical harassment and continuing to fight for LGBTQ+ rights in Asheville."
    },
    'blade_journalists': {
        name: 'Matilda Bliss & Veronica Coit',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "They arrested us for telling the truth. The Blade doesn't stop printing.",
                choices: [
                    { text: "What happened?", next: "arrest" },
                    { text: "The truth survives.", next: "truth" }
                ]
            },
            arrest: {
                text: "Matilda Bliss and Veronica Coit, reporters for the Asheville Blade. We documented a homeless encampment eviction — they handcuffed us for it. But the story got out.",
                choices: [{ text: "Journalism is resistance.", next: "truth" }]
            },
            truth: {
                text: "Every story they tried to kill, we published anyway. There are passages in these walls they don't know about. We mapped them. Let us show you.",
                reward: 'reveal_passage',
                choices: [{ text: "Lead the way.", next: "farewell" }]
            },
            farewell: {
                text: "The archive never sleeps. Neither do we.",
                choices: []
            }
        },
        fact: "Matilda Bliss and Veronica Coit are journalists for the Asheville Blade who were arrested while documenting a homeless encampment eviction, drawing national attention to press freedom."
    },
    'community_mothers': {
        name: 'The Chosen Family Hearth',
        era: 'Always',
        dialogue: {
            greeting: {
                text: "Blood doesn't make family, baby. Love does. And we've got plenty.",
                choices: [
                    { text: "I need rest.", next: "rest" },
                    { text: "Tell me about this place.", next: "place" }
                ]
            },
            rest: {
                text: "Come here, child. Sit down. Let these old hands hold some of that weight for a while. You've been carrying too much alone.",
                effect: 'community_heal',
                choices: [{ text: "Thank you, mothers.", next: "farewell" }]
            },
            place: {
                text: "This hearth has always been here, even when they tried to erase us. Trans elders built it. We tend it for every child who comes through.",
                choices: [{ text: "I need to rest.", next: "rest" }]
            },
            farewell: {
                text: "You are loved. You are powerful. Now go — and carry us with you.",
                choices: []
            }
        },
        fact: "Chosen family networks of trans elders have sustained LGBTQ+ communities for generations, providing care, housing, and cultural continuity across Appalachia and beyond."
    },
    'crystal_labeija': {
        name: 'Crystal LaBeija',
        era: '1970s',
        dialogue: {
            greeting: {
                text: "Honey, Crystal LaBeija. House of LaBeija — I BUILT this. Before there was a ballroom, there was me.",
                choices: [
                    { text: "Tell me about the House system.", next: "house" },
                    { text: "Why did you start it?", next: "origin" }
                ]
            },
            house: {
                text: "A House is chosen family, protection, legacy. When your blood family throws you away, your House catches you. We compete, yes — but we survive together.",
                choices: [{ text: "Your community is beautiful.", next: "farewell" }]
            },
            origin: {
                text: "Because Black and Latin queens were locked out of white pageants. We needed our own stage, our own glory, our own homes. So I built one.",
                reward: 'labeija_trophy',
                choices: [{ text: "Your legacy lives in every House.", next: "farewell" }]
            },
            farewell: {
                text: "Walk your category, child. The floor is yours.",
                choices: []
            }
        },
        fact: "Crystal LaBeija was the founding mother of the House of LaBeija, credited with establishing New York's Ballroom scene in the early 1970s — creating a haven where BIPOC queer and trans people could compete, thrive, and form chosen families."
    },
    'angie_xtravaganza': {
        name: 'Angie Xtravaganza',
        era: 'Late 20th Century',
        dialogue: {
            greeting: {
                text: "I'm Angie Xtravaganza. The House of Xtravaganza was mine to build and mine to protect. My children were everything.",
                choices: [
                    { text: "What was it like raising a House?", next: "house" },
                    { text: "How did you survive the AIDS crisis?", next: "aids" }
                ]
            },
            house: {
                text: "My girls were trans women of color who had nothing. I gave them everything I had. Isn't that what mothers do?",
                choices: [{ text: "You showed what love looks like.", next: "farewell" }]
            },
            aids: {
                text: "We lost so many. Too many. I lost children. But we kept showing up — for ballrooms, for funerals, for each other. That is how you survive.",
                reward: 'item_shield',
                choices: [{ text: "Your House carries on.", next: "farewell" }]
            },
            farewell: {
                text: "My children's names are still being called on that floor. Listen for us.",
                choices: []
            }
        },
        fact: "Angie Xtravaganza was the founding mother of the House of Xtravaganza, one of the most iconic Houses in Ballroom culture. She was featured in the documentary 'Paris Is Burning' and raised trans women of color through the AIDS crisis until her death in 1993."
    },
    'mama_gloria': {
        name: 'Mama Gloria',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "Gloria Allen, darling — they call me Mama Gloria. I taught charm and etiquette to trans youth in Chicago for thirty years. Sit up straight.",
                choices: [
                    { text: "Why charm school?", next: "charm" },
                    { text: "What did you teach them?", next: "teach" }
                ]
            },
            charm: {
                text: "Because when you carry yourself with grace, the world has a harder time denying you exist. Etiquette is armor. Presentation is power. I taught survival with a smile.",
                choices: [{ text: "That's profound wisdom.", next: "teach" }]
            },
            teach: {
                text: "How to sit, how to walk, how to look someone in the eye without flinching. How to be so undeniably yourself that hatred bounces off. Let me teach you something.",
                effect: 'charm_lesson',
                choices: [{ text: "I'm grateful for this lesson.", next: "farewell" }]
            },
            farewell: {
                text: "Head up. Shoulders back. You are magnificent.",
                choices: []
            }
        },
        fact: "Gloria 'Mama Gloria' Allen founded a charm school for transgender youth in Chicago in the 1960s and continued teaching for decades, offering etiquette, self-confidence, and survival skills — depicted in the award-winning play 'The Charm.'"
    },
    'kenya_cuevas': {
        name: 'Kenya Cuevas',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "Kenya Cuevas. My best friend La Parado was murdered. So I built Casa de las Muñecas Tiresias — a home where no trans woman needs to sleep on the street.",
                choices: [
                    { text: "Tell me about your friend.", next: "friend" },
                    { text: "What is the shelter like?", next: "shelter" }
                ]
            },
            friend: {
                text: "She was beautiful and fierce. They killed her for existing. I couldn't save her. But I can save others. Her death became a door I refuse to close.",
                choices: [{ text: "Her memory lives through your work.", next: "shelter" }]
            },
            shelter: {
                text: "A real home. Not a charity — a home. A trans mausoleum to honor our dead. A shelter for the living. We built it all with our own hands.",
                reward: 'star_solidarity',
                choices: [{ text: "You turned grief into sanctuary.", next: "farewell" }]
            },
            farewell: {
                text: "No one dies alone while I'm standing.",
                choices: []
            }
        },
        fact: "Kenya Cuevas is a Mexican trans activist who founded Casa de las Muñecas Tiresias after her best friend was murdered. She built a shelter, a trans mausoleum, and organized Mexico's first trans march — turning personal grief into community care."
    },
    'gauri_sawant': {
        name: 'Gauri Sawant',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "I am Gauri Sawant. When Gayatri's mother died, she asked me to be her mother. I said yes. That is all. That is everything.",
                choices: [
                    { text: "What was that moment like?", next: "moment" },
                    { text: "How did you fight for legal rights?", next: "legal" }
                ]
            },
            moment: {
                text: "She was a child who had nothing. I was a trans woman the world said had no right to mother. And in that meeting, we gave each other exactly what we needed.",
                choices: [{ text: "You were both each other's answer.", next: "legal" }]
            },
            legal: {
                text: "India's court fought us. Society fought us. But Gayatri and I — we were stronger than their papers. Every trans person deserves the right to love and be loved as family.",
                reward: 'ability_vision',
                choices: [{ text: "Your love rewrote what's possible.", next: "farewell" }]
            },
            farewell: {
                text: "A mother's love has no gender. Take this clarity with you.",
                choices: []
            }
        },
        fact: "Gauri Sawant is an Indian transgender activist and mother who adopted a child named Gayatri after her mother died. Her Supreme Court of India petition helped advance trans rights, and a Vicks 'Touch of Care' campaign featuring her story reached millions worldwide."
    },
    'mariela_munoz': {
        name: 'Mariela Muñoz',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "Mariela Muñoz. Veintitrés hijos. Twenty-three children. They came to me with nothing, and I gave them everything I had.",
                choices: [
                    { text: "Twenty-three? How?", next: "how" },
                    { text: "What did you give them?", next: "gave" }
                ]
            },
            how: {
                text: "One by one. A runaway. A youth thrown out. A child the system forgot. They found my door. I never turned one away. Argentina was not always kind to us, but my home was.",
                choices: [{ text: "Your home was a revolution.", next: "gave" }]
            },
            gave: {
                text: "Food. Shelter. A name for what they were, when they had no name. Love. A mother. Some of them I buried. All of them I remember.",
                effect: 'heal_full',
                choices: [{ text: "Thank you for your love, Mariela.", next: "farewell" }]
            },
            farewell: {
                text: "Come back whenever you need feeding. My door does not close.",
                choices: []
            }
        },
        fact: "Mariela Muñoz was an Argentine transgender woman who raised 23 children over her lifetime, most of them abandoned by their families. She was a pioneer of trans rights in Argentina and a testament to motherhood as devotion, not biology."
    },
    'cleopatra_kambugu': {
        name: 'Cleopatra Kambugu',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "Cleopatra Kambugu. Uganda is not an easy place to be trans. But I am still here. That itself is a form of fighting.",
                choices: [
                    { text: "How did you survive?", next: "survive" },
                    { text: "What are you fighting for?", next: "fight" }
                ]
            },
            survive: {
                text: "By being visible. When I could hide, I chose to be seen. Every time someone sees a trans person living openly, the world gets a little less dangerous for the next one.",
                choices: [{ text: "Visibility is courage.", next: "fight" }]
            },
            fight: {
                text: "For every trans person in Uganda who doesn't have the platform I have. For my community. For the right to exist without apology.",
                reward: 'ability_rage',
                choices: [{ text: "Your fight is our fight.", next: "farewell" }]
            },
            farewell: {
                text: "Courage is not the absence of fear. It's being afraid and still standing.",
                choices: []
            }
        },
        fact: "Cleopatra Kambugu is a Ugandan trans rights pioneer and the subject of the documentary 'The Pearl of Africa' (2016). She continues to advocate for LGBTQ+ rights in East Africa despite significant personal risk."
    },
    'wewha': {
        name: "We'wha",
        era: '19th Century',
        dialogue: {
            greeting: {
                text: "I am We'wha, lhamana of the Zuni people. My life was lived between — in the space where categories dissolve and spirit remains.",
                choices: [
                    { text: "What does lhamana mean?", next: "lhamana" },
                    { text: "What was your life like?", next: "life" }
                ]
            },
            lhamana: {
                text: "One who carries both. The Zuni did not see gender as a wall — it was a river. I crossed, recrossed, lived freely. This was not a crisis. It was a calling.",
                choices: [{ text: "That sounds like freedom.", next: "life" }]
            },
            life: {
                text: "I was a weaver, a potter, an ambassador. I met President Chester Arthur. I showed the world what we had always known: some of us carry everything, and that is sacred.",
                reward: 'wewha_blessing',
                choices: [{ text: "Your spirit still crosses with us.", next: "farewell" }]
            },
            farewell: {
                text: "The river has always flowed here. It will flow long after them. Go where the water takes you.",
                choices: []
            }
        },
        fact: "We'wha (1849–1896) was a Zuni lhamana who combined aspects of both male and female Zuni gender roles. As a cultural ambassador, We'wha visited Washington D.C. and met President Grover Cleveland, representing the Indigenous understanding of gender's fluidity."
    },
    'jennifer_boylan': {
        name: 'Jennifer Finney Boylan',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "Jennifer Finney Boylan. Author. Activist. Someone who told her story at a time when trans stories were almost never told — and hoped it would matter.",
                choices: [
                    { text: "Did it matter?", next: "matter" },
                    { text: "What kept you going?", next: "kept" }
                ]
            },
            matter: {
                text: "Letters from people who cried reading it and felt less alone. Emails from kids who finally had words for themselves. Yes. It mattered enormously.",
                choices: [{ text: "Stories are medicine.", next: "kept" }]
            },
            kept: {
                text: "My family. Knowing that my wife still loved me. Knowing that love could survive transformation — maybe grow larger in the surviving. Take this clarity.",
                reward: 'ability_vision',
                choices: [{ text: "Thank you for writing us into existence.", next: "farewell" }]
            },
            farewell: {
                text: "Tell your story. Even to yourself. Especially to yourself.",
                choices: []
            }
        },
        fact: "Jennifer Finney Boylan is an American author whose 2003 memoir 'She's Not There' was the first bestselling book by a transgender American. She has served on the board of GLAAD and advocated for trans visibility for decades."
    },
    'mj_rodriguez': {
        name: 'MJ Rodriguez',
        era: 'Contemporary',
        dialogue: {
            greeting: {
                text: "MJ Rodriguez. Blanca Evangelista on Pose — but more than that, I'm proof that trans women belong in every room, on every stage.",
                choices: [
                    { text: "What did Blanca mean to you?", next: "blanca" },
                    { text: "What do you want people to take away?", next: "message" }
                ]
            },
            blanca: {
                text: "Blanca was a House Mother. A fighter. A woman who built family when family was denied. Playing her was playing every trans woman who mothered through the worst of times.",
                choices: [{ text: "You made her real for so many.", next: "message" }]
            },
            message: {
                text: "That we are here. That we have always been here. That trans joy is not a footnote — it is the whole story. The floor is open.",
                reward: 'labeija_trophy',
                choices: [{ text: "Thank you for showing us ourselves.", next: "farewell" }]
            },
            farewell: {
                text: "Keep walking, honey. The ballroom never closes.",
                choices: []
            }
        },
        fact: "MJ Rodriguez is an actress and singer who played Blanca Evangelista in the FX series 'Pose.' In 2022, she became the first transgender woman to win a Golden Globe Award for Best Actress in a Drama Series."
    },
    'william_dorsey_swann': {
        name: 'William Dorsey Swann',
        era: '1880s–1890s',
        dialogue: {
            greeting: {
                text: "I am William Dorsey Swann. I was born enslaved. I freed myself. And then I called myself the queen of drag — the very first to use the word — in Washington City, in 1888.",
                choices: [
                    { text: "How did you survive the raids?", next: "raids" },
                    { text: "Why a 'queen'?", next: "queen" }
                ]
            },
            raids: {
                text: "By holding the door. By standing in front of my children when the police came. By bailing them out. They beat us, jailed us, called us obscene. We hosted the next ball anyway. Refusal is a craft.",
                choices: [{ text: "You held the door so the rest of us could walk through.", next: "gift" }]
            },
            queen: {
                text: "Because there was no other word that fit. So I made one fit. Every queen who has ever walked a ball, every house mother who has ever caught a child — they walk a path I cleared with my own scarred feet.",
                choices: [{ text: "Thank you for clearing it.", next: "gift" }]
            },
            gift: {
                text: "Take this. The first door is the hardest. Once you've held it open, no one can ever close it all the way again.",
                reward: 'item_brick',
                choices: [{ text: "I'll hold the next one.", next: "farewell" }]
            },
            farewell: {
                text: "Walk like a queen. The word is yours now.",
                choices: []
            }
        },
        fact: "William Dorsey Swann (1858–1925) was a formerly enslaved Black man widely recognized as one of the first Americans to refer to himself as a 'queen' of drag. He hosted secret drag balls in Washington, D.C. through the 1880s–1890s despite frequent brutal police raids and is considered a foundational figure of organized queer resistance in the United States."
    },
    'dorian_corey': {
        name: 'Dorian Corey',
        era: 'Mid–Late 20th Century',
        dialogue: {
            greeting: {
                text: "Dorian Corey. House of Corey, founded 1972. Parsons-trained. I made every gown my children walked the floor in — and I made damn sure their seams could survive a runway *and* a bus ride home.",
                choices: [
                    { text: "What did you teach your children?", next: "teach" },
                    { text: "Why the focus on craft?", next: "craft" }
                ]
            },
            teach: {
                text: "Patience. A straight stitch. How to read a room before you read a sister. How to lose a category with grace and walk it again next month with twice the answer. Realness is rehearsal — survival is the recital.",
                choices: [{ text: "That sounds like the real syllabus.", next: "craft" }]
            },
            craft: {
                text: "Because if your gown falls apart on the floor, the judges remember the gown. If your gown holds, they remember *you*. I trained Angie Xtravaganza. I trained Hector. I built a lineage out of strong seams and stronger spines.",
                reward: 'ability_vision',
                choices: [{ text: "Thank you, Mother Corey.", next: "farewell" }]
            },
            farewell: {
                text: "Posture, child. The light is on you whether you asked for it or not.",
                choices: []
            }
        },
        fact: "Dorian Corey (1937–1993) was the founding Mother of the House of Corey (1972). A Parsons School of Design–trained seamstress, she designed her children's couture and was a celebrated mentor — most notably training Mother Angie Xtravaganza and Grandfather Hector Xtravaganza. Featured prominently in 'Paris Is Burning' (1990)."
    },
    'paris_dupree': {
        name: 'Paris Dupree',
        era: 'Late 20th Century',
        dialogue: {
            greeting: {
                text: "Paris Dupree, baby. House of Dupree — first house out of Brooklyn. Folks call me a mother's-mother. Means I built mothers who built mothers. The lineage doesn't end with me; it *began* with me.",
                choices: [
                    { text: "You started voguing?", next: "vogue" },
                    { text: "How did the houses spread?", next: "spread" }
                ]
            },
            vogue: {
                text: "I read a Vogue magazine and I made the poses move. Hands, hips, snap, drop. Madonna saw it. Malcolm McLaren saw it. They took it to the world without our names attached. So now you say my name. Paris. Dupree.",
                choices: [{ text: "Paris Dupree. Said and remembered.", next: "spread" }]
            },
            spread: {
                text: "I never gatekept. Ebony, Revlon, Princess, Milan — I told my children: go *make* your own house. Mother your own children. The floor gets bigger when you build more floors. That's how a movement grows.",
                reward: 'labeija_trophy',
                choices: [{ text: "I'll build my own floor.", next: "farewell" }]
            },
            farewell: {
                text: "Walk like the magazine is watching. Because, baby — it always is.",
                choices: []
            }
        },
        fact: "Paris Dupree founded the House of Dupree, the first ballroom house based in Brooklyn, alongside Father Burger Dupree. She is widely credited as the original innovator of voguing and is the namesake of the landmark documentary 'Paris Is Burning' (1990). She is often called a 'mother's-mother' for actively encouraging the formation of subsequent houses."
    },
    'coccinelle': {
        name: 'Coccinelle',
        era: 'Mid 20th Century',
        dialogue: {
            greeting: {
                text: "Jacqueline Charlotte Dufresnoy — they called me Coccinelle, the ladybug. In the 1950s, I was one of the first to live openly as a trans woman in France.",
                choices: [
                    { text: "What was Paris like for you?", next: "paris" },
                    { text: "How did you find yourself?", next: "self" }
                ]
            },
            paris: {
                text: "Beautiful and cruel. The Carrousel de Paris gave us a stage — for the first time, we could be ourselves for an audience that paid to see us shine. But outside those walls, it was different.",
                choices: [{ text: "The stage was safety.", next: "self" }]
            },
            self: {
                text: "I have always been myself. The world needed time to catch up. I had surgery, I married, I lived fully — in an era when most trans women had no such options. I am grateful.",
                reward: 'item_shield',
                choices: [{ text: "Your courage opened doors for generations.", next: "farewell" }]
            },
            farewell: {
                text: "Be magnificent, darling. It is not optional.",
                choices: []
            }
        },
        fact: "Coccinelle (1931–2006) was a French actress and cabaret performer among the first trans women in France to undergo gender-affirming surgery (1958) and live openly. She was an international celebrity in the 1950s–60s and a trailblazer for European trans visibility."
    },

    // ───────────────────────────────────────────────────────────────────────
    // ECHOES — the Archive holds more than zines. Down in the deeper shelves
    // it's holding whole *stories* — other queer survival narratives that
    // didn't survive intact. They leak. When you find an Echo Chamber, someone
    // from one of those stories is still in there, real to themselves. These
    // entries are flagged `echo: true` so they don't count toward the 9
    // ancestors; `room` is the chamber's display name.
    'echo_lu_fin': {
        name: 'Lu (& Fin)', era: 'an unfinished story', echo: true, room: 'THE WIBBLY-WOBBLY ECHO',
        dialogue: {
            greeting: {
                text: "Marshmallow ground. Licorice thrones in the distance. The boy with the Doc Martens — that's Lu. The bright loud one bouncing around him in the blue suit — that's Fin. Fin grins: \"Oh GOOD, an audience! Lu, look, the Archive remembered us!\"",
                choices: [
                    { text: "What is this place?", next: "place" },
                    { text: "Lu — are you okay?", next: "lu" }
                ]
            },
            place: {
                text: "Fin: \"It's the part of the story where Lu almost didn't make it. His parents wouldn't say his name. He came here instead.\" Fin's voice doesn't drop. \"But here's the trick — I'm not a separate person. I'm the piece of him that still thinks happiness is possible. So he made it. He's making it. Watch — he's looking up.\"",
                choices: [{ text: "Then I'm glad you're loud.", next: "gift" }]
            },
            lu: {
                text: "Lu, quiet: \"...I'm a man. I knew it the way you know your own hands. They didn't, or wouldn't. I came here so tired.\" Fin, gently for once: \"And then you stayed. You let me hang around. Tell them what we found.\" Lu, a little surprised at himself: \"...a way through. Invisible until you trust it's there.\"",
                choices: [{ text: "Show me the way through.", next: "gift" }]
            },
            gift: {
                text: "Fin spins in a circle. \"Take this — the trick of seeing the path that isn't drawn yet. It's how Lu got out. It's how anyone gets out.\" The marshmallow ground bounces you a little higher than physics allows.",
                reward: 'ability_vision',
                choices: [{ text: "Thank you, Lu. Thank you, Fin.", next: "farewell" }]
            },
            farewell: {
                text: "Fin: \"Toward the chocolate waterfalls now, Lu. We earned it.\" Lu, almost smiling: \"...okay. Okay.\" They walk off into colour.",
                choices: []
            }
        },
        fact: "From the play 'Fin, Luna and The Wibbly Wobbly Way To Happiness': Lu, a young trans man, processes the trauma of parental rejection in a surreal afterlife; Fin — 'genderless and genderful' — is revealed to be the fragment of Lu's own consciousness that never stopped believing in joy. The story is about integration: surviving by reclaiming your own resilience."
    },
    'echo_barry_scott': {
        name: 'Barry & Scott', era: 'a story still being repaired', echo: true, room: 'THE MEMORY ECHO',
        dialogue: {
            greeting: {
                text: "A cramped studio apartment — VHS tapes, a box TV hissing static. It keeps flickering: a redwood forest, a hotel room, headlights. A big awkward man (Barry) flinches at each shift. A young person in skinny jeans (Scott, they/them) stands between him and the worst of it. Scott: \"Hey. Easy. The walls are doing the thing again. Breathe with me.\"",
                choices: [
                    { text: "What's happening to him?", next: "barry" },
                    { text: "Scott — are *you* okay?", next: "scott" }
                ]
            },
            barry: {
                text: "Scott, low: \"My dad. He did a lot of damage when I was small — a DUI with me in the car, a night in a hotel I still dream about. He's sick. Schizophrenia, the drinking. The room turns into those nights and he gets lost in them.\" Barry, surfacing: \"...I was a monster. I'm not — I'm trying not to be. Every day. That's the job now.\"",
                choices: [{ text: "Trying every day counts.", next: "gift" }]
            },
            scott: {
                text: "Scott shrugs, careful. \"I learned to go quiet to survive him. I'm un-learning it. Came back to talk it through — not to fix him, just to... be a person in the room with him. We're both doing the work.\" Barry, watching the walls steady: \"...thank you for staying in the room.\"",
                choices: [{ text: "How do you keep the room from shifting?", next: "gift" }]
            },
            gift: {
                text: "Scott presses something into your hand — a small ordinary stone. \"It's a grounding thing. When the world starts turning into the bad memory, you hold it and it... slows. Lets you heal in real time instead of bleeding in flashback time. Take it. We've got each other.\"",
                reward: 'item_bloom',
                choices: [{ text: "Thank you. Both of you, hold on.", next: "farewell" }]
            },
            farewell: {
                text: "The apartment stops flickering — just an apartment, just two people in it. Barry exhales. Scott nods at you once, like a promise.",
                choices: []
            }
        },
        fact: "From the play 'Super Big Shit Hairballs': Barry, a man battling addiction and mental illness, is interrupted mid-suicide-attempt by his estranged non-binary child Scott, who comes to process childhood trauma. The room shifts into memories of past harm; the play ends not on absolution but on a fragile, real reconciliation — and the recognition that recovery is a daily act."
    },
    'echo_projection_booth': {
        name: 'The Projection Booth', era: 'a transmission, ongoing', echo: true, room: 'THE FREQUENCY ECHO',
        dialogue: {
            greeting: {
                text: "A drive-in lot, late, rain on every windshield. Voices crackle in over the radio — a dozen cars, nobody getting out, everybody talking. A woman's voice, fragile: \"...I think I'm just *playing* mother. It's the longest improv scene I've ever done and I don't have the script.\" A booth somewhere hums and answers in all of them at once.",
                choices: [
                    { text: "Who am I listening to?", next: "voices" },
                    { text: "What is the Booth?", next: "booth" }
                ]
            },
            voices: {
                text: "The Booth: \"Hector tracks his son in a 214-column spreadsheet and still can't find the column for *connection*. Barry hasn't spoken to his kid in three years and is rehearsing the apology. Skylar — that's the scared one — is learning that 'playing mother' and 'being one' might be the same act, performed long enough. They can't see each other. They're learning to reach anyway. So are you.\"",
                choices: [{ text: "How do I reach across, then?", next: "gift" }]
            },
            booth: {
                text: "The Booth: \"I'm the part of every transmission that doesn't end. A signal doesn't stop just because the broadcast does — it keeps going, out past where anyone's listening. Memory works the same. So does love, if you let it. The static is just the distance. Tune through it.\"",
                choices: [{ text: "Then tune me through.", next: "gift" }]
            },
            gift: {
                text: "The radios all hiss to one clean frequency for a moment. \"There. You can hear the architecture now — the ways through these walls that nobody mapped. Passages. The Archive hides them; the signal doesn't. Go.\" The dial steadies. Hidden routes flicker into being around you.",
                reward: 'reveal_passage',
                choices: [{ text: "Thank you. Keep transmitting.", next: "farewell" }]
            },
            farewell: {
                text: "Dawn somewhere. One by one the voices sign off — \"...goodnight, kid\" — \"...I'll call this time\" — \"...I love you, even from here.\" The rain keeps falling. The Booth keeps humming.",
                choices: []
            }
        },
        fact: "From the audio play 'STATIC': isolated in cars at a rainy drive-in, estranged parents and children speak only over radio frequencies — about imperfection, distance, and learning to reach each other anyway. The Projection Booth is the omniscient, gentle presence that signals and memories never truly end."
    },
    'echo_andi_mann': {
        name: 'Andi Mann', era: 'a story too tangled to shelve', echo: true, room: 'THE BIG-TOP ECHO',
        dialogue: {
            greeting: {
                text: "Sawdust and rigging. A circus that's all knives and debt — a ringmaster everyone owes and everyone wants dead, a knife-thrower running an affair, a clown counting the money he lent that's never coming back. A wiry crew-hand sidles up, low: \"Don't make eye contact with the bearded lady, she's having a year. Name's Andi. I, uh — I don't actually work here.\"",
                choices: [
                    { text: "Then what are you doing here?", next: "job" },
                    { text: "Why is this place such a mess?", next: "mess" }
                ]
            },
            job: {
                text: "Andi, quieter: \"Half this troupe is hiding from a warrant. I'm the one sent in to find which half. Undercover so deep I've started believing my own cover story. Queer kid who ran away to the circus — that part's true, actually. The badge is the costume.\" A wry look. \"You learn things, working a place where everyone's pretending. Like which pretending keeps people alive.\"",
                choices: [{ text: "Teach me something useful.", next: "gift" }]
            },
            mess: {
                text: "Andi: \"It's a chosen family, technically — they just chose *poorly*, and then chose each other anyway, and now they can't leave. Debts and grudges and one bad ringmaster. It's not so different from a House. Same architecture. Different lighting.\" He glances over his shoulder. \"Anyway. You didn't see me.\"",
                choices: [{ text: "Slip me something for the road.", next: "gift" }]
            },
            gift: {
                text: "Andi palms you something cold and sharp from under his coat. \"Off the books. Bites hard, no questions. Use it before anyone clocks that you're not part of the act — which, around here, you've got about thirty seconds for.\" He's already drifting back into the crowd, somebody else entirely.",
                reward: 'ability_rage',
                choices: [{ text: "I owe you one, Andi.", next: "farewell" }]
            },
            farewell: {
                text: "Somewhere behind the big top a deal goes wrong, loudly. Andi is, conveniently, not there. The story keeps tangling without you.",
                choices: []
            }
        },
        fact: "From the 'Murder Mystery' character roster: a circus syndicate webbed with debt, romance and revenge — twenty performers orbiting a ringmaster everyone owes. Andi Mann is the undercover fixer planted inside, hunting fugitives among the runaways: a queer kid whose origin story is real even when the badge is a costume."
    },
    'echo_zo': {
        name: 'Zo', era: 'a story that ate itself', echo: true, room: 'THE APOCALYPSE ECHO',
        dialogue: {
            greeting: {
                text: "A worn living room dressed for the end of the world — Trump poster, mounted rifles, a window that, if you look too long, shows the cardboard backstage behind it. Someone with colour-streaked hair, a flask, and a neon-green gun is sitting on the couch eating lavender macaroons. They don't look up. \"Oh good. Another one. Hi. I'm Zo. None of this is real, by the way. Macaroon?\"",
                choices: [
                    { text: "What do you mean 'not real'?", next: "real" },
                    { text: "Why are you still here, then?", next: "stay" }
                ]
            },
            real: {
                text: "Zo gestures with the gun, bored. \"This was a play. A bad one. Trump zombies, trigger-warning jokes, two actors who hated each other. It collapsed — I shot the script, basically — and then it just... kept going without an audience. So now it's an Echo. I'm the part that knows.\" A beat. \"Knowing doesn't help as much as you'd think.\"",
                choices: [{ text: "It might. Knowing kept you queer and alive.", next: "stay" }]
            },
            stay: {
                text: "Zo finally looks at you. The edge under the boredom: \"...volunteer-run radical queer bookstore. That was my real life. Before. I keep the gun because the things that come through these walls don't care that they're fictional — and neither do I, when one's chewing on me.\" A shrug. \"You learn to make a weapon out of whatever the story left lying around. That's basically the whole skill.\"",
                choices: [{ text: "Then arm me before I leave.", next: "gift" }]
            },
            gift: {
                text: "Zo tosses you something humming and green. \"It shoots... certainty. Point it at whatever's coming and it stops being able to argue with you for a while. Won't kill you, won't fix you — just buys time. Everything good does.\" They go back to the macaroons. \"Tell the Archive its filing system sucks.\"",
                reward: 'item_shield',
                choices: [{ text: "I will. Stay sharp, Zo.", next: "farewell" }]
            },
            farewell: {
                text: "Outside the cardboard window, something approaches. Zo doesn't move. \"Door's that way. Run faster than the metaphor.\"",
                choices: []
            }
        },
        fact: "From the play 'Make This Play Great Again: A Trump-Infested Zombie Apocalypse': a post-apocalyptic survival story that dissolves into the meta-drama of the actors performing it. Zo — genderqueer, radicalized, formerly of a communist queer bookstore — is its chaos agent, the one who breaks the fourth wall, and the one who keeps surviving anyway."
    },
    'echo_peer_sol': {
        name: 'Sol', era: 'the before-times', echo: true, room: 'THE CRISIS LINE ECHO',
        dialogue: {
            greeting: {
                text: "Static, then a calm voice through what appears to be a phone receiver embedded in the Archive wall. \"Trans Lifeline, this is Sol — they/them. Peer specialist, not a therapist. I've memorized the DSM-5-TR and I've got time.\" A pause. \"You're not calling a crisis line. You found an Echo. But the same offer stands: what are you carrying today?\"",
                choices: [
                    { text: "Tell me about mental health in queer communities.", next: "overview" },
                    { text: "I'm not doing okay right now.", next: "crisis" }
                ]
            },
            overview: {
                text: "Sol, even and clear: \"Here's what the research says as of 2026: LGBTQ+ people experience depression, anxiety, and PTSD at 2–4x the rates of cisgender heterosexual peers. Not because we're broken — because minority stress is real. Discrimination, rejection, and sustained political violence cause genuine psychiatric harm. The DSM-5-TR names the conditions. The Minority Stress Model explains the cause. Affirming environments are part of the cure.\" A notebook rustles. \"What do you want to know more about?\"",
                choices: [
                    { text: "Mood disorders — depression and bipolar.", next: "mood" },
                    { text: "Anxiety, trauma, and PTSD.", next: "anxiety_trauma" }
                ]
            },
            crisis: {
                text: "\"Okay. Glad you said it.\" Sol's voice steadies. \"You're still talking — that's step one. If you're in the US: call or text 988 (Suicide and Crisis Lifeline), Trans Lifeline at 877-565-8860, or The Trevor Project at 1-866-488-7386 for youth under 25. In the Archive: I'm here.\" Something warm radiates through the static. \"You matter — not because of what you contribute, but because you exist. That has always been enough.\"",
                effect: "heal_full",
                choices: [
                    { text: "I'm still here. Thank you.", next: "overview" }
                ]
            },
            mood: {
                text: "Sol: \"MDD needs 5+ symptoms for 2+ weeks — depressed mood or anhedonia required — plus weight or sleep changes, fatigue, psychomotor shifts, worthlessness, concentration problems, thoughts of death. Bipolar I requires a manic episode: 7+ days of elevated or irritable mood with 3+ symptoms including grandiosity, decreased sleep need, racing thoughts, reckless behavior. Bipolar II: hypomanic episodes plus major depression, never a full manic episode. Cyclothymia: 2+ years of sub-threshold cycling. All real. All treatable. All frequently misdiagnosed as BPD in queer AFAB people — push for second opinions.\"",
                choices: [
                    { text: "What about anxiety and trauma?", next: "anxiety_trauma" },
                    { text: "Thank you, Sol. I needed that map.", next: "gift" }
                ]
            },
            anxiety_trauma: {
                text: "Sol: \"PTSD is exposure to actual or threatened death, injury, or sexual violence — then intrusion symptoms, avoidance, negative cognition and mood changes, hyperarousal — lasting over a month. GAD is 6+ months of uncontrollable worry across multiple domains with physical symptoms. ICD-11 recognizes CPTSD — complex trauma from prolonged, inescapable harm — which DSM-5-TR does not yet include. The system is catching up slowly. For trans people navigating conversion therapy, family rejection, medical gatekeeping, and state legislation targeting their bodies: CPTSD is usually the more accurate frame. Treatments: CPT, EMDR, Prolonged Exposure, trauma-informed DBT. Affirming therapists change outcomes.\"",
                choices: [
                    { text: "What keeps people going through all that?", next: "gift" }
                ]
            },
            gift: {
                text: "Sol slides something through a gap in the Archive wall. \"Take this — it's what I wrote in the margins of every DSM I ever worked from: the diagnoses, and the thing the diagnoses can't say — that the harm was not your fault, that you adapted to survive, that recovery is possible and real. The names for the terrain mean you're not wandering alone. Go. And call if you need to. The line stays open.\"",
                reward: 'ability_vision',
                choices: [
                    { text: "Thank you, Sol. I'll keep the line moving.", next: "farewell" }
                ]
            },
            farewell: {
                text: "The static softens. Quietly, the voice continues into the Archive's depths: \"...Trans Lifeline, this is Sol. What are you carrying today?\" The line does not close. It never does.",
                choices: []
            }
        },
        fact: "Peer support specialists with lived LGBTQ+ experience staff Trans Lifeline (877-565-8860, US & Canada), The Trevor Project (1-866-488-7386, youth under 25), and the 988 Suicide & Crisis Lifeline (call or text 988, US). In 2026, with trans healthcare under sustained political attack, these lines are frontline infrastructure. Call if you need to. You are not alone."
    }
};

// Echo figures live inside HISTORICAL_FIGURES (so the dialogue UI works
// unchanged) but are tracked separately and never count toward the ancestors.
export const ECHO_KEYS = ['echo_lu_fin', 'echo_barry_scott', 'echo_projection_booth', 'echo_andi_mann', 'echo_zo', 'echo_peer_sol'];

export const TREASURES = {
    'flag': { name: 'Pride Flag', desc: 'A beautiful rainbow flag!', image: '/images/item_pride_flag.png' },
    'nametag': { name: 'Name Tag', desc: 'Your real name in bold letters.', image: '/images/item_kindred.png' },
    'letter': { name: 'Support Letter', desc: 'Love from chosen family.', image: '/images/item_outright.png' },
    'meds': { name: 'HRT Meds', desc: 'Steps toward authenticity.', image: '/images/item_trans_charm.png' },
    'pin': { name: 'Trans Pin', desc: 'Small but powerful symbol.', image: '/images/item_resistance_pin.png' },
    'photo': { name: 'Family Photo', desc: 'Your chosen family at Pride.', image: '/images/item_stonewall.png' },
    'mirror': { name: 'Affirming Mirror', desc: 'Shows your true self.', image: '/images/item_civic_shield.png' },
    'notes': { name: 'Therapy Notes', desc: 'Wisdom for the journey.', image: '/images/item_archive.png' }
};

export const HEALING_ITEMS = {
    'tea': { name: 'Healing Tea', desc: 'Chamomile and lavender restore you.', healing: 1, image: '/images/item_tea.png' },
    'book': { name: 'Book of Affirmations', desc: 'Self-love heals wounds.', healing: 2, image: '/images/item_book.png' },
    'crystal': { name: 'Healing Crystal', desc: 'Amethyst radiates healing energy.', healing: 3, image: '/images/item_crystal.png' }
};

export const GEMINI_GUIDE = {
    name: "AI ARCHIVE SPIRIT (GEMINI)",
    responses: [
        "I am the keeper of the Queer Archives. What would you like to know about our shared history?",
        "Every zine you collect strengthens our collective memory. Data is resistance.",
        "I can help you navigate the wasteland. My sensors detect high levels of queer joy in the deeper archives.",
        "The historical figures you meet are ancestors. Their courage is your inheritance.",
        "I am powered by the collective spirit of those who came before. How can I assist your revolution today?"
    ]
};

// ---------------------------------------------------------------------------
// Difficulty modes. damageScale multiplies enemy-dealt damage; values map
// each "1 damage" hit to fractional hearts (¼ / ½ / 1). bonusHearts is added
// to the player's max health on dungeon entry. lootBonus multiplies drop
// rolls (Easy throws more loot at you; Hard throws less but rarer loot still
// breaks through).
export const DIFFICULTIES = {
    easy:   { id: 'easy',   label: 'EASY',   damageScale: 0.25, bonusHearts: 2,  lootBonus: 1.6,  rareBonus: 1.0, color: '#39FF14',
              tagline: '¼ heart per hit · +2 hearts · loot rains' },
    normal: { id: 'normal', label: 'NORMAL', damageScale: 0.5,  bonusHearts: 0,  lootBonus: 1.0,  rareBonus: 1.0, color: '#01CDFE',
              tagline: '½ heart per hit · standard hearts · standard loot' },
    hard:   { id: 'hard',   label: 'HARD',   damageScale: 1.0,  bonusHearts: -1, lootBonus: 0.7,  rareBonus: 1.6, color: '#FF0040',
              tagline: '1 heart per hit · -1 heart · rare loot favored' }
};

// ---------------------------------------------------------------------------
// Tiered loot system — pulled from rogue-likes & ARPGs but trans-themed and
// (we hope) more interesting than Diablo 3's mostly-flat orange affix soup.
// Each tier carries a name pool, a glow color, a pickup effect, and a scrap
// reward. Effects layer (Rare+ heals; Epic+ buffs damage; Legendary stamps a
// permanent stat onto the persistent profile).
export const LOOT_TIERS = {
    common: {
        weight: 55, color: '#CCCCCC', glow: '#FFFFFF', scrap: 1,
        names: ['Bent Rebar', 'Scrap Wire', 'Cracked Mirror', 'Old Pamphlet', 'Dented Locket', 'Archival Fragment'],
        effect: null
    },
    uncommon: {
        weight: 28, color: '#39FF14', glow: '#39FF14', scrap: 2,
        names: ['Resistance Pin', 'Liberation Pamphlet', 'Pride Shoelace', 'Borrowed Lipstick', 'Recovered Photo', 'Homegrown Families Blessing', 'Vicks Touch of Care', "Sawant's Petition", 'Grounding Pebble', 'Trans Lifeline Card', 'DBT Skills Card', 'Crisis Plan Laminate'],
        effect: 'small_heal'   // +1 hp
    },
    rare: {
        weight: 12, color: '#01CDFE', glow: '#01CDFE', scrap: 4,
        names: ['Solidarity Charm', 'Mutual-Aid Token', 'Marsha\'s Hairpin', 'Sylvia\'s Lighter', 'Stonewall Coin', 'Youth OUTright Badge', "Mama Gloria's Charm Book", "Mariela's Tarot Deck", "Boylan's Memoir", 'DBT Workbook', 'Peer Support Badge', '988 Lifeline Token', "Sol's Hotline Notes"],
        effect: 'big_heal'     // +2 hp + +1 next hit
    },
    epic: {
        weight: 4, color: '#B967DB', glow: '#B967DB', scrap: 8,
        names: ['Hirschfeld\'s Notes', 'Christine\'s Letter', 'Gilded Pronoun Pin', 'Eleanor\'s Diary', 'Safe Shelter Key', "House Mother's Sash", "Rivera's Megaphone", 'DSM-5-TR (Annotated)', 'Psychiatric Advance Directive'],
        effect: 'rage_vial'    // +3 hp + 6s damage boost
    },
    legendary: {
        weight: 1, color: '#FFD700', glow: '#FFD700', scrap: 20,
        names: ['Stonewall Brick', 'Compton\'s Cafeteria Sugar Shaker', 'Crown of Eleanor Rykener', 'Lili\'s Last Brushstroke', 'Hearth Stone', "Mother's Fierce Light", "LaBeija's Trophy", 'The Mausoleum Flower'],
        effect: 'permanent_heart'  // permanent +1 max health (lineage)
    }
};

// Name-specific effects that override tier defaults when a named item is picked up.
export const NAMED_ITEM_EFFECTS = {
    'Hearth Stone':               'hearth_stone',
    "Mother's Fierce Light":      'mothers_light',
    'Youth OUTright Badge':       'youth_badge',
    'Safe Shelter Key':           'safe_key',
    'Homegrown Families Blessing':'homegrown_blessing',
    'Archival Fragment':          'archival_fragment',
    "LaBeija's Trophy":           'labeija_trophy',
    'The Mausoleum Flower':       'mausoleum_flower',
    "House Mother's Sash":        'house_mother_sash',
    "Rivera's Megaphone":         'riveras_megaphone',
    "Mama Gloria's Charm Book":   'charm_book',
    "Mariela's Tarot Deck":       'tarot_deck',
    "Boylan's Memoir":            'boylan_memoir',
    'Vicks Touch of Care':        'vicks_care',
    "Sawant's Petition":          'sawant_petition',
    'STAR House Key':             'star_key'
};

// ---------------------------------------------------------------------------
// WEAPONS — hack-and-slash loadout (Cendric-style modifiers baked into each
// weapon instead of socketed gems). dmgBonus adds to every swing; procs roll
// per hit; kb multiplies knockback; reach 2 lets the swing connect a tile
// further; lifesteal heals a fraction of damage dealt.
export const WEAPONS = {
    spoon: {
        id: 'spoon', name: 'Rusty Spoon', icon: '🥄', tier: 'common', price: 0,
        dmgBonus: 0, critBonus: 0, kb: 1.0, reach: 1,
        desc: 'The classic. It has seen things.'
    },
    stiletto: {
        id: 'stiletto', name: 'Stiletto Heel', icon: '👠', tier: 'uncommon', price: 10,
        dmgBonus: 0, critBonus: 0.20, kb: 0.9, reach: 1,
        desc: 'Fast, precise, fabulous. +20% crit.'
    },
    tattoo_gun: {
        id: 'tattoo_gun', name: 'Tattoo Gun', icon: '🖋', tier: 'uncommon', price: 12,
        dmgBonus: 0, critBonus: 0.05, kb: 0.9, reach: 1,
        proc: { status: 'burn', chance: 0.35, duration: 150 },
        desc: 'Inks a burn that keeps stinging. 35% ignite.'
    },
    bike_lock: {
        id: 'bike_lock', name: 'Bike Lock & Chain', icon: '🔗', tier: 'rare', price: 16,
        dmgBonus: 1, critBonus: 0, kb: 1.7, reach: 2,
        desc: 'Heavy, long, and very persuasive. +1 dmg, big knockback, long reach.'
    },
    banjo: {
        id: 'banjo', name: 'Cursed Banjo', icon: '🪕', tier: 'rare', price: 18,
        dmgBonus: 1, critBonus: 0, kb: 1.3, reach: 1,
        proc: { status: 'shock', chance: 0.25, duration: 45 },
        desc: 'Every chord is a power chord. +1 dmg, 25% stun.'
    },
    glitter_blade: {
        id: 'glitter_blade', name: 'The Glitterblade', icon: '⚔', tier: 'legendary', price: 40,
        dmgBonus: 2, critBonus: 0.10, kb: 1.4, reach: 2, lifesteal: 0.5,
        proc: { status: 'burn', chance: 0.25, duration: 150 },
        desc: 'Forged from every brick ever thrown. +2 dmg, lifesteal, ignites.'
    }
};
export const WEAPON_KEYS = Object.keys(WEAPONS);

// ---------------------------------------------------------------------------
// POTIONS — pocketable consumables (keys 1-4, or tap in the inventory bag).
export const POTIONS = {
    tonic: {
        id: 'tonic', name: 'Herbal Tonic', icon: '🧪', hotkey: '1', price: 4,
        desc: '+2 HP. Brewed with mountain herbs.'
    },
    brew: {
        id: 'brew', name: 'Hearth Brew', icon: '☕', hotkey: '2', price: 9,
        desc: 'Full heal. Tastes like being believed.'
    },
    warpaint: {
        id: 'warpaint', name: 'War Paint', icon: '💄', hotkey: '3', price: 7,
        desc: '+1 damage for 12 seconds. Wing it sharp enough to kill.'
    },
    ward: {
        id: 'ward', name: 'Ward Charm', icon: '🛡', hotkey: '4', price: 7,
        desc: 'Halves incoming damage for 10 seconds.'
    }
};
export const POTION_KEYS = Object.keys(POTIONS);

// ---------------------------------------------------------------------------
// COMPANIONS — rescued from cages in the depths; one rides along per run,
// trailing behind you, each with a passive perk. The cozy-critter roster.
export const COMPANIONS = {
    cat: {
        id: 'cat', name: 'Alley Cat', icon: '🐈‍⬛', color: '#B967DB',
        perk: 'crit', perkDesc: '+10% crit chance — she shows you where to bite.'
    },
    crow: {
        id: 'crow', name: 'Archive Crow', icon: '🐦‍⬛', color: '#01CDFE',
        perk: 'magnet', perkDesc: 'Fetches loot — pickups drift to you from 3 tiles away.'
    },
    moth: {
        id: 'moth', name: 'Lantern Moth', icon: '🦋', color: '#FFD700',
        perk: 'light', perkDesc: '+2 sight radius — carries a little lamp of her own.'
    },
    axolotl: {
        id: 'axolotl', name: 'Brave Axolotl', icon: '🦎', color: '#F5A9B8',
        perk: 'regen', perkDesc: 'Regenerates 1 HP every 45 seconds. Soft and indestructible.'
    },
    snail: {
        id: 'snail', name: 'Disco Snail', icon: '🐌', color: '#39FF14',
        perk: 'aura', perkDesc: 'Sparkle aura — nearby enemies get briefly stunned sometimes.'
    }
};
export const COMPANION_KEYS = Object.keys(COMPANIONS);

// ---------------------------------------------------------------------------
// FISH — the Safehouse pond. Casting is free; the catch log (fish-dex)
// persists forever, and every fish is a pocketable snack with an effect.
export const FISH = {
    minnow:   { id: 'minnow',   name: 'Neon Minnow',       icon: '🐟', weight: 40, tier: 'common',
                effect: 'heal1',      desc: 'Glows faintly. +1 HP.' },
    bass:     { id: 'bass',     name: 'Brick Bass',        icon: '🐠', weight: 24, tier: 'uncommon',
                effect: 'heal2',      desc: 'Dense. Historic. +2 HP.' },
    turtle:   { id: 'turtle',   name: 'Teacup Turtle',     icon: '🐢', weight: 12, tier: 'uncommon',
                effect: 'ward',       desc: 'Lends you its shell — damage halved for 10s.' },
    eel:      { id: 'eel',      name: 'Static Eel',        icon: '🪱', weight: 9,  tier: 'rare',
                effect: 'shock_aura', desc: 'Crackles. Your next 10s of hits stun.' },
    koi:      { id: 'koi',      name: 'Glitter Koi',       icon: '🎏', weight: 8,  tier: 'rare',
                effect: 'warpaint',   desc: 'Sheds sequins. +1 damage for 12s.' },
    angelfish:{ id: 'angelfish',name: 'Archive Angelfish', icon: '🐡', weight: 4,  tier: 'epic',
                effect: 'fullheal',   desc: 'Remembers you. Full heal + 50 XP.' },
    bubbles:  { id: 'bubbles',  name: 'Mx. Bubbles',       icon: '🫧', weight: 2,  tier: 'epic',
                effect: 'jump',       desc: 'Defies gravity, categories, and you. +1 jump this run.' },
    carp:     { id: 'carp',     name: 'The Gilded Carp',   icon: '🐉', weight: 1,  tier: 'legendary',
                effect: 'heart_piece',desc: 'The pond\'s landlord. Coughs up a Heart Piece.' }
};
export const FISH_KEYS = Object.keys(FISH);

// ---------------------------------------------------------------------------
// Cozy quests. Each quest is given by an NPC ('giver'), tracked across runs
// in game.persistent.quests, and turned in via a dialogue branch on the same
// (or another) NPC. Progress is updated by hooks placed throughout main.js
// and combat.js (see updateQuestProgress).
//
// Quest object schema:
//   id            stable key
//   title         shown in quest log
//   giver         figureKey of NPC who offers it
//   turnInWith    figureKey of NPC where you turn it in (defaults to giver)
//   summary       1-line summary
//   detail        longer flavor text (markdown-ish)
//   goal          { type: 'collect_zines'|'kill_enemy'|'read_murals'|'collect_item'|'reach_depth', target: number, enemyType?, item? }
//   reward        { scrap?, permanentHearts?, permanentDamage?, message }
//   acceptDialog  text spoken when offered
//   pendingDialog text spoken when checking in mid-quest
//   completeDialog text spoken on turn-in
//
// State per quest in game.persistent.quests[id]:
//   status: 'available' | 'active' | 'ready' | 'completed'
//   progress: number
export const QUESTS = {
    'tea_for_the_hearth': {
        id: 'tea_for_the_hearth',
        title: 'Tea for the Hearth',
        giver: 'community_mothers',
        summary: 'Bring 2 Healing Tea to the Hearth Mothers.',
        detail: 'The Hearth Mothers want to brew a pot for the next runaway who walks in cold. Find Healing Tea in the wasteland and bring it back.',
        goal: { type: 'collect_item', item: 'tea', target: 2 },
        reward: { permanentHearts: 1, message: 'The Hearth grows warmer. +1 permanent heart.' },
        acceptDialog: "Bring me 2 Healing Tea, child. I want a pot ready for whoever walks in next.",
        pendingDialog: "Still steeping, baby? Bring me 2 Healing Tea when you find them.",
        completeDialog: "Bless you. Sit a moment. Then go — and carry the warmth with you."
    },
    'mural_witness': {
        id: 'mural_witness',
        title: 'The Walls Remember',
        giver: 'blade_journalists',
        summary: 'Read 5 murals across the wasteland.',
        detail: 'The Blade keeps a record of every mural left on the walls. Read 5 and report back what you saw — every reading is publication.',
        goal: { type: 'read_murals', target: 5 },
        reward: { scrap: 12, message: 'The Blade prints your testimony. +12 scrap.' },
        acceptDialog: "Read 5 murals. Any 5. We'll publish what you saw — the walls are the front page.",
        pendingDialog: "How many walls so far? We need 5 testimonies before the next print run.",
        completeDialog: "5 testimonies. Set in type tomorrow. Take this for your trouble."
    },
    'bigot_patrol': {
        id: 'bigot_patrol',
        title: "House Mother's Patrol",
        giver: 'crystal_labeija',
        summary: 'Defeat 5 Gentrifiers (bigots) in the wasteland.',
        detail: 'Crystal LaBeija saw too many of her children chased out of their own neighborhoods. Clear 5 Gentrifiers from the wasteland to keep the path home open.',
        goal: { type: 'kill_enemy', enemyType: 'bigot', target: 5 },
        reward: { permanentDamage: 1, message: "Crystal nods. The next swing hits harder. +1 permanent damage." },
        acceptDialog: "Take down 5 Gentrifiers, baby. Every one you stop is a sister who gets to keep her apartment.",
        pendingDialog: "Keep walking that floor. 5 Gentrifiers — every one you stop opens a door home.",
        completeDialog: "5 down. Read for filth, baby. Take this — your hands are stronger now."
    },
    'archive_keeper': {
        id: 'archive_keeper',
        title: 'Archive Keeper',
        giver: 'marsha',
        summary: 'Collect 3 zines in a single run.',
        detail: "Marsha wants the archive to keep growing. Bring back 3 zines from a single run — survival is a publishing schedule.",
        goal: { type: 'collect_zines_run', target: 3 },
        reward: { scrap: 18, message: 'Marsha laughs. The archive thanks you. +18 scrap.' },
        acceptDialog: "Honey, find me 3 zines in one trip. Don't die between zines 2 and 3 — that's just rude.",
        pendingDialog: "Three zines, one run, baby. Try again if the wasteland ate the last batch.",
        completeDialog: "Pay it no mind, honey. The archive grows. Take this — buy yourself something nice."
    },
    'first_door': {
        id: 'first_door',
        title: 'The First Door',
        giver: 'william_dorsey_swann',
        summary: 'Reach Depth 5 to honor the door Swann held open.',
        detail: 'William Dorsey Swann held the door against police raids in the 1880s so the next century of queens could walk through. Reach Depth 5 to prove the door is still open.',
        goal: { type: 'reach_depth', target: 5 },
        reward: { scrap: 25, permanentHearts: 1, message: 'Swann smiles. The door opens further. +25 scrap, +1 permanent heart.' },
        acceptDialog: "Reach Depth 5, child. The door I held — prove it's still open.",
        pendingDialog: "Keep walking. Depth 5. The door waits.",
        completeDialog: "You walked through. The next queen walks through because of you. Take this."
    },
    'mental_health_archive': {
        id: 'mental_health_archive',
        title: 'The Mental Health Archive',
        giver: 'community_mothers',
        summary: 'Collect 5 zines to build the mental health archive.',
        detail: "The community mothers know that mental health resources are survival tools. Collect 5 zines — any kind — and bring them back. Knowledge of what people carry is as sacred as knowledge of who they were.",
        goal: { type: 'collect_zines_run', target: 5 },
        reward: { permanentHearts: 1, scrap: 15, message: 'The archive grows. Community knows they are not alone. +1 permanent heart, +15 scrap.' },
        acceptDialog: "Bring me 5 zines from the wasteland, child. Every one of them is someone who will feel less alone. That is the work.",
        pendingDialog: "Still gathering? Five zines — any kind. Every page you find is a hand reaching back through time.",
        completeDialog: "Five. Printed, shared, held. The archive breathes. Take this — you built something that outlasts you."
    }
};

export const QUEST_KEYS = Object.keys(QUESTS);

// ---------------------------------------------------------------------------
// STORY CARDS — a collectible codex of the world. Authored "world" cards
// unlock as you reach new depth zones (and a few key moments); ancestor and
// echo cards are generated live from the figures you meet (see UI.showCodex).
// Tone is drawn from the Lichcraft brief: a future where one megacorp ("PRIME")
// privatized everything and buried trans care under a 300-year waitlist — and
// the lineage that refuses to wait quietly to die.
export const STORY_CARDS = {
    prime_corp: {
        name: 'PRIME', type: 'Faction', icon: '🏢', color: '#01CDFE',
        entry: 'The megacorp that swallowed the state. Once a humble everything-store, PRIME now runs fire, ambulance, housing, food and "health." Your tier is your worth — Basic, Plus, Premium, Black. It never outright refuses you care; that would imply inefficiency. It simply adds you to a list and waits. The Archive remembers when these were public goods, freely given.'
    },
    the_waitlist: {
        name: 'THE 300-YEAR WAITLIST', type: 'Concept', icon: '⏳', color: '#9ACD32',
        entry: 'PRIME\'s masterpiece of cruelty: a queue for gender-affirming care so long that no living person reaches its end. To admit it is broken would imply the system fails — so instead they wait for you to die and call it efficiency. Down here, some people chose a different way to outlast the list. The lineage was born from that refusal.'
    },
    the_archive: {
        name: 'THE ARCHIVE', type: 'Place', icon: '📚', color: '#FFD700',
        entry: 'A living library buried beneath the ruins, holding every zine they tried to burn and every name they struck from the record. It keeps more than paper — it keeps whole stories, and some of them leak. You are its keeper now. Data is resistance; remembering is rebellion.'
    },
    the_lineage: {
        name: 'THE LINEAGE', type: 'Concept', icon: '🕯️', color: '#F5A9B8',
        entry: 'Chosen family across centuries — ancestors who mothered the abandoned, held doors against the police, walked the ballroom floor, and refused to vanish quietly. Meet them in the depths and they move into the Safehouse. Their courage is your inheritance; your job is to carry it deeper.'
    },
    prime_enforcement: {
        name: 'PRIME ENFORCEMENT', type: 'Faction', icon: '🚨', color: '#FF0040',
        entry: 'The hands of the corporation: gatekeepers who deny you at the desk, concern-trolls who whisper doubt, gentrifiers who price you out, and the police who do the rest. They patrol by sight and by sound. Stay behind them, stay quiet, and the system never sees you coming — that is the whole art of stealth down here.'
    },
    the_long_defiance: {
        name: 'THE LONG DEFIANCE', type: 'Concept', icon: '♾️', color: '#FFFFFF',
        entry: 'If they will wait for you to die, then refuse to die. The deepest secret of the Core is not a spell but a stance: outlast them. Survive long enough, gather enough of the lineage, and the queue itself becomes the thing that breaks. Immortality, it turns out, is just stubbornness with better lighting.'
    },
    the_safehouse: {
        name: 'THE SAFEHOUSE SANCTUARY', type: 'Place', icon: '🏛️', color: '#5BCEFA',
        entry: 'Between descents you rest here — a tower the ancestors built where no PRIME drone flies. The Hearth holds your upgrades, the Atrium your quests, and each floor fills with the people you met below. Blood does not make family. Love does. And here there is plenty.'
    },
    the_echoes: {
        name: 'THE ECHOES', type: 'Concept', icon: '📼', color: '#B967DB',
        entry: 'The Archive holds whole stories, not just zines — and some did not survive intact. They flicker. When you find a room that is glitching, someone is still inside it, real to themselves. Say hello. A story that did not survive whole is still a story. Hold it anyway.'
    },
    the_ballroom: {
        name: 'THE BALLROOM', type: 'Place', icon: '👑', color: '#FF1493',
        entry: 'Locked out of every other stage, the Houses built their own — and crowned each other. A gold-shimmer room where enemies cannot follow and the floor is always yours. Crystal, Angie, Paris, Dorian: mothers who made glory out of refusal, and a family out of strangers.'
    },
    the_ladders: {
        name: 'FIELD NOTE — THE WAY BACK', type: 'Concept', icon: '🪜', color: '#39FF14',
        entry: 'The stairs down stay locked until a floor gives up every zine and every ancestor. But the shafts run both ways: grab a ladder and climb with ↑/↓ to go back up for whatever you missed. No one is left behind in the Archive — not a zine, not a person, not you.'
    }
};
export const STORY_CARD_KEYS = Object.keys(STORY_CARDS);
