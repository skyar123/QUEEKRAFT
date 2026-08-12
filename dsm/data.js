// DSM-5-TR study content.
//
// The DSM-5-TR text is copyrighted by the American Psychiatric Association.
// Nothing here is copied from the manual. Category and disorder NAMES are
// factual labels taken from the public classification; the short summaries,
// hallmark cues, and vignettes are paraphrased educational material written
// for this study game and should not be used for clinical decisions.

export const CATEGORIES = [
  {
    id: 'neurodevelopmental',
    name: 'Neurodevelopmental Disorders',
    short: 'Neurodev',
    color: '#01CDFE',
    blurb: 'Conditions with onset in the developmental period — early-life deficits in personal, social, academic, or occupational functioning.',
    disorders: [
      {
        name: 'Intellectual Developmental Disorder',
        cues: ['Deficits in intellectual and adaptive functioning', 'Onset during developmental period'],
        vignette: 'A child shows persistent difficulty with reasoning, problem-solving, and adaptive life skills across home and school since early childhood.',
      },
      {
        name: 'Autism Spectrum Disorder',
        cues: ['Social communication deficits', 'Restricted, repetitive patterns of behavior or interests', 'Sensory differences'],
        vignette: 'A 6-year-old rarely makes eye contact, lines up toys for hours, melts down at fluorescent lighting, and speaks in scripted phrases.',
      },
      {
        name: 'Attention-Deficit/Hyperactivity Disorder',
        cues: ['Inattention and/or hyperactivity-impulsivity', 'Symptoms before age 12', 'Present in two or more settings'],
        vignette: 'A college student loses keys daily, blurts answers in seminars, cannot sit through a film, and has done this since grade school.',
      },
      {
        name: 'Specific Learning Disorder',
        cues: ['Persistent difficulty with reading, writing, or math', 'Below expected for age', 'Despite adequate instruction'],
        vignette: 'A bright 9-year-old still struggles to decode unfamiliar words and reverses letters long after peers have stopped.',
      },
      {
        name: 'Tourette\'s Disorder',
        cues: ['Multiple motor tics and at least one vocal tic', 'Onset before age 18', 'Persists more than a year'],
        vignette: 'Since age 8, a teen has had blinking and shoulder-shrug tics plus throat-clearing sounds that wax and wane.',
      },
      {
        name: 'Developmental Coordination Disorder',
        cues: ['Motor coordination markedly below expected for age', 'Interferes with daily activities'],
        vignette: 'A child trips often, drops utensils, and cannot tie laces well into late elementary years.',
      },
    ],
  },
  {
    id: 'schizophrenia',
    name: 'Schizophrenia Spectrum & Other Psychotic Disorders',
    short: 'Psychotic',
    color: '#B967DB',
    blurb: 'Conditions defined by abnormalities in one or more of: delusions, hallucinations, disorganized thinking/speech, grossly disorganized or abnormal motor behavior, and negative symptoms.',
    disorders: [
      {
        name: 'Schizophrenia',
        cues: ['Two or more core psychotic symptoms', 'Continuous signs for at least 6 months', 'Marked functional decline'],
        vignette: 'A 22-year-old has heard accusing voices for a year, believes the news is sending him coded orders, and has withdrawn from school and friends.',
      },
      {
        name: 'Schizoaffective Disorder',
        cues: ['Psychotic symptoms plus a mood episode', 'Psychosis present without mood symptoms for at least 2 weeks at some point'],
        vignette: 'A patient cycles through manic and depressive episodes, but also has stretches of delusions when mood is stable.',
      },
      {
        name: 'Brief Psychotic Disorder',
        cues: ['Psychotic symptoms lasting more than a day but less than a month', 'Eventual full return to baseline'],
        vignette: 'After her father\'s sudden death, a woman becomes acutely paranoid for two weeks then fully recovers.',
      },
      {
        name: 'Schizophreniform Disorder',
        cues: ['Schizophrenia-like symptoms', 'Duration between 1 and 6 months'],
        vignette: 'A man has persistent hallucinations and disorganized speech for 4 months before symptoms remit.',
      },
      {
        name: 'Delusional Disorder',
        cues: ['One or more delusions for a month or more', 'Functioning otherwise largely preserved', 'No other prominent psychotic symptoms'],
        vignette: 'A 50-year-old quietly insists a co-worker is poisoning her coffee, but otherwise works and socializes normally.',
      },
    ],
  },
  {
    id: 'bipolar',
    name: 'Bipolar & Related Disorders',
    short: 'Bipolar',
    color: '#FFD700',
    blurb: 'Mood disorders characterized by episodes of mania or hypomania, usually alternating with depressive episodes.',
    disorders: [
      {
        name: 'Bipolar I Disorder',
        cues: ['At least one full manic episode lasting a week (or any duration requiring hospitalization)', 'Depressive episodes typical but not required'],
        vignette: 'A 30-year-old goes 5 days without sleep, drains his savings on a vague startup, talks so fast no one can interrupt, and is hospitalized.',
      },
      {
        name: 'Bipolar II Disorder',
        cues: ['At least one hypomanic episode', 'At least one major depressive episode', 'No full manic episode ever'],
        vignette: 'A graduate student has long depressive stretches punctuated by 5-day bursts of elevated mood, productivity, and reduced sleep that do not impair her.',
      },
      {
        name: 'Cyclothymic Disorder',
        cues: ['Numerous hypomanic and depressive periods for at least 2 years', 'Symptoms never meet full criteria for mania or major depression'],
        vignette: 'For three years, an artist has cycled between mildly elevated weeks and gloomy weeks without ever fully crashing or peaking.',
      },
    ],
  },
  {
    id: 'depressive',
    name: 'Depressive Disorders',
    short: 'Depressive',
    color: '#01CDFE',
    blurb: 'Disorders unified by sad, empty, or irritable mood with somatic and cognitive changes that significantly affect functioning.',
    disorders: [
      {
        name: 'Major Depressive Disorder',
        cues: ['Five or more depressive symptoms for at least 2 weeks', 'Includes depressed mood or loss of interest', 'Represents a change from baseline'],
        vignette: 'For a month, a 40-year-old has felt empty, slept twelve hours but felt exhausted, lost interest in everything, and quietly wished not to wake up.',
      },
      {
        name: 'Persistent Depressive Disorder',
        cues: ['Depressed mood most days for at least 2 years', 'At least two additional depressive features'],
        vignette: 'A 28-year-old describes feeling low "as long as I can remember" — never crashing, never lifting.',
      },
      {
        name: 'Premenstrual Dysphoric Disorder',
        cues: ['Mood symptoms tied to the late luteal phase', 'Remit shortly after menses', 'Confirmed by at least two cycles of tracking'],
        vignette: 'For two cycles, a woman becomes severely irritable and tearful in the week before her period, then is fine within days of bleeding starting.',
      },
      {
        name: 'Disruptive Mood Dysregulation Disorder',
        cues: ['Severe recurrent temper outbursts', 'Persistent irritable mood between outbursts', 'Onset before age 10'],
        vignette: 'A 9-year-old explodes at small frustrations several times a week and stays irritable between outbursts; symptoms began at age 7.',
      },
    ],
  },
  {
    id: 'anxiety',
    name: 'Anxiety Disorders',
    short: 'Anxiety',
    color: '#FF71CE',
    blurb: 'Disorders sharing excessive fear (response to imminent threat) and anxiety (anticipation of future threat) with related behavioral disturbances.',
    disorders: [
      {
        name: 'Generalized Anxiety Disorder',
        cues: ['Excessive worry about many domains for at least 6 months', 'Hard to control', 'Physical symptoms (restlessness, fatigue, tension, sleep)'],
        vignette: 'For most of the year, a manager has worried constantly about work, money, her kids\' safety, and minor errands, with daily muscle tension and poor sleep.',
      },
      {
        name: 'Panic Disorder',
        cues: ['Recurrent unexpected panic attacks', 'Persistent worry about more attacks or behavior change because of them'],
        vignette: 'A man has had several sudden surges of terror with chest pain and choking sensations and now avoids driving in case another hits.',
      },
      {
        name: 'Social Anxiety Disorder',
        cues: ['Marked fear of social or performance situations', 'Fear of negative evaluation', 'Avoidance or distress'],
        vignette: 'A college student dreads any class with cold-calling, eats lunch alone in the bathroom, and turns down job offers requiring presentations.',
      },
      {
        name: 'Agoraphobia',
        cues: ['Fear in two or more situations (transit, open spaces, crowds, lines, being alone outside)', 'Fear of being unable to escape or get help'],
        vignette: 'A woman has not used the bus, gone to the mall, or left home alone for months because she fears panic and being trapped.',
      },
      {
        name: 'Specific Phobia',
        cues: ['Marked fear of a specific object or situation', 'Out of proportion to actual danger', 'Avoidance'],
        vignette: 'An adult will not enter any building with elevators and reroutes her job search to avoid them entirely.',
      },
      {
        name: 'Separation Anxiety Disorder',
        cues: ['Developmentally inappropriate fear of separation from attachment figures', 'Reluctance to be alone or away from home'],
        vignette: 'A 10-year-old refuses sleepovers, calls her mother in tears from school, and has nightmares about losing her.',
      },
      {
        name: 'Selective Mutism',
        cues: ['Consistent failure to speak in specific social situations', 'Speaks in other settings', 'Interferes with achievement or communication'],
        vignette: 'A first-grader chats at home but has not spoken a word at school for the whole semester.',
      },
    ],
  },
  {
    id: 'ocd',
    name: 'Obsessive-Compulsive & Related Disorders',
    short: 'OCD-related',
    color: '#B967DB',
    blurb: 'Disorders centered on intrusive thoughts and/or repetitive behaviors.',
    disorders: [
      {
        name: 'Obsessive-Compulsive Disorder',
        cues: ['Recurrent obsessions and/or compulsions', 'Time-consuming or distressing', 'Behaviors aimed at neutralizing distress'],
        vignette: 'A man washes his hands until they bleed because intrusive thoughts about contamination feel intolerable until he scrubs.',
      },
      {
        name: 'Body Dysmorphic Disorder',
        cues: ['Preoccupation with perceived defects in appearance', 'Repetitive behaviors (mirror checking, grooming)', 'Defects not observable or appear slight to others'],
        vignette: 'A teen spends hours checking her nose in mirrors, certain it is grotesque, though no one else perceives an abnormality.',
      },
      {
        name: 'Hoarding Disorder',
        cues: ['Persistent difficulty discarding possessions', 'Accumulation that clutters living areas', 'Distress at the thought of discarding'],
        vignette: 'Newspapers and bags fill every room of an apartment to chest height; the resident becomes panicked when family suggests throwing anything out.',
      },
      {
        name: 'Trichotillomania',
        cues: ['Recurrent hair pulling resulting in hair loss', 'Repeated attempts to stop'],
        vignette: 'A college student has bare patches on her scalp from years of pulling hair while studying.',
      },
      {
        name: 'Excoriation (Skin-Picking) Disorder',
        cues: ['Recurrent skin picking causing lesions', 'Repeated attempts to stop'],
        vignette: 'A young adult picks at his arms for hours nightly, leaving open sores he cannot keep himself from reopening.',
      },
    ],
  },
  {
    id: 'trauma',
    name: 'Trauma- & Stressor-Related Disorders',
    short: 'Trauma',
    color: '#FF0040',
    blurb: 'Disorders for which exposure to a traumatic or stressful event is an explicit diagnostic criterion.',
    disorders: [
      {
        name: 'Posttraumatic Stress Disorder',
        cues: ['Exposure to actual or threatened death/injury/sexual violence', 'Intrusion symptoms, avoidance, negative cognitions/mood, arousal/reactivity', 'Duration more than a month'],
        vignette: 'A veteran has nightmares and flashbacks of an IED a year after deployment, avoids fireworks, feels detached, and startles easily.',
      },
      {
        name: 'Acute Stress Disorder',
        cues: ['Trauma exposure', 'Intrusion, avoidance, dissociation, arousal symptoms', 'Lasts 3 days to 1 month'],
        vignette: 'Two weeks after a car crash, a survivor has nightmares, feels unreal, avoids the freeway, and is jumpy.',
      },
      {
        name: 'Adjustment Disorder',
        cues: ['Emotional or behavioral symptoms in response to an identifiable stressor', 'Onset within 3 months', 'Out of proportion to stressor'],
        vignette: 'A college student becomes deeply tearful and withdrawn for a month after a breakup, but symptoms do not meet criteria for major depression.',
      },
      {
        name: 'Reactive Attachment Disorder',
        cues: ['Pattern of inhibited, emotionally withdrawn behavior toward caregivers', 'History of insufficient care', 'Onset before age 5'],
        vignette: 'A 4-year-old adopted from an under-resourced orphanage rarely seeks comfort, even when distressed.',
      },
      {
        name: 'Disinhibited Social Engagement Disorder',
        cues: ['Overly familiar behavior with unfamiliar adults', 'History of insufficient care'],
        vignette: 'A preschooler with a history of neglect will go off with any stranger without checking back with caregivers.',
      },
      {
        name: 'Prolonged Grief Disorder',
        cues: ['Persistent yearning and preoccupation with the deceased', 'At least 12 months after the loss for adults', 'Significant distress or impairment'],
        vignette: 'Eighteen months after her husband\'s death, a widow still cannot enter their bedroom and feels life is meaningless.',
      },
    ],
  },
  {
    id: 'dissociative',
    name: 'Dissociative Disorders',
    short: 'Dissociative',
    color: '#9966FF',
    blurb: 'Disruptions in the normally integrated functions of consciousness, memory, identity, emotion, perception, body representation, motor control, and behavior.',
    disorders: [
      {
        name: 'Dissociative Identity Disorder',
        cues: ['Two or more distinct personality states', 'Recurrent gaps in recall of everyday events'],
        vignette: 'A woman finds clothes she does not remember buying and is told she answers to a different name some days.',
      },
      {
        name: 'Dissociative Amnesia',
        cues: ['Inability to recall important autobiographical information', 'Usually of a traumatic or stressful nature', 'Too extensive for ordinary forgetfulness'],
        vignette: 'After a violent assault, a man cannot recall the week before or after the event despite being awake and functional throughout.',
      },
      {
        name: 'Depersonalization/Derealization Disorder',
        cues: ['Persistent or recurrent feelings of being detached from oneself or surroundings', 'Reality testing intact'],
        vignette: 'A graduate student says she watches her life "from behind glass" and the world looks two-dimensional, though she knows it is not really so.',
      },
    ],
  },
  {
    id: 'somatic',
    name: 'Somatic Symptom & Related Disorders',
    short: 'Somatic',
    color: '#FF71CE',
    blurb: 'Conditions in which physical symptoms — or fears about physical symptoms — drive substantial distress and impairment.',
    disorders: [
      {
        name: 'Somatic Symptom Disorder',
        cues: ['One or more distressing somatic symptoms', 'Excessive thoughts, feelings, or behaviors about the symptoms'],
        vignette: 'A patient has chronic back pain and spends most of her day researching it, attending appointments, and worrying about its meaning.',
      },
      {
        name: 'Illness Anxiety Disorder',
        cues: ['Preoccupation with having or acquiring a serious illness', 'Few or no somatic symptoms', 'High health-related anxiety'],
        vignette: 'A healthy man checks his pulse hourly and books weekly cardiology visits convinced he is about to have a heart attack despite normal tests.',
      },
      {
        name: 'Functional Neurological Symptom Disorder',
        cues: ['Altered voluntary motor or sensory function', 'Incompatibility between symptoms and recognized conditions'],
        vignette: 'A young woman has sudden non-epileptic seizure-like episodes that do not show on EEG and resolve when she is distracted.',
      },
      {
        name: 'Factitious Disorder',
        cues: ['Falsification of physical or psychological signs/symptoms', 'Deception evident even without external reward'],
        vignette: 'A nurse repeatedly injects herself with insulin to induce hypoglycemia and present at ERs as a mystery case.',
      },
    ],
  },
  {
    id: 'feeding',
    name: 'Feeding & Eating Disorders',
    short: 'Eating',
    color: '#FFD700',
    blurb: 'Persistent disturbances in eating or eating-related behavior leading to altered consumption or absorption of food and impaired health or psychosocial functioning.',
    disorders: [
      {
        name: 'Anorexia Nervosa',
        cues: ['Restriction of energy intake leading to significantly low body weight', 'Intense fear of gaining weight', 'Body image disturbance'],
        vignette: 'A 17-year-old eats 600 kcal a day, runs for hours, is severely underweight, and sees herself as fat in the mirror.',
      },
      {
        name: 'Bulimia Nervosa',
        cues: ['Recurrent binge eating', 'Recurrent inappropriate compensatory behaviors (purging, fasting, exercise)', 'Occurs at least weekly for 3 months'],
        vignette: 'A college student secretly eats a half-gallon of ice cream and a pizza, then vomits, several times a week.',
      },
      {
        name: 'Binge-Eating Disorder',
        cues: ['Recurrent binge eating', 'Marked distress', 'No regular compensatory behavior'],
        vignette: 'A man eats until painfully full once or twice a week, alone, feeling ashamed afterward, without purging or fasting.',
      },
      {
        name: 'Avoidant/Restrictive Food Intake Disorder',
        cues: ['Avoidance or restriction not driven by body image concern', 'Significant weight loss or nutritional deficiency or psychosocial impairment'],
        vignette: 'A 12-year-old eats only crackers and one brand of yogurt because of texture aversion, losing significant weight.',
      },
      {
        name: 'Pica',
        cues: ['Persistent eating of nonnutritive nonfood substances for at least 1 month', 'Inappropriate for developmental level'],
        vignette: 'A 7-year-old regularly eats chalk and clay from the playground.',
      },
      {
        name: 'Rumination Disorder',
        cues: ['Repeated regurgitation of food', 'Not due to a medical condition'],
        vignette: 'An infant repeatedly brings up food after feeding and re-chews it without nausea or evident GI cause.',
      },
    ],
  },
  {
    id: 'elimination',
    name: 'Elimination Disorders',
    short: 'Elimination',
    color: '#01CDFE',
    blurb: 'Inappropriate elimination of urine or feces, usually first diagnosed in childhood.',
    disorders: [
      {
        name: 'Enuresis',
        cues: ['Repeated voiding of urine into bed or clothes', 'At least age 5 (developmental)', 'At least twice a week for 3 months or causes impairment'],
        vignette: 'A 7-year-old wets the bed three nights a week with no medical cause.',
      },
      {
        name: 'Encopresis',
        cues: ['Repeated passage of feces in inappropriate places', 'At least age 4 (developmental)', 'At least once a month for 3 months'],
        vignette: 'A 5-year-old has bowel movements in his pants several times a month with no medical explanation.',
      },
    ],
  },
  {
    id: 'sleep',
    name: 'Sleep-Wake Disorders',
    short: 'Sleep',
    color: '#9966FF',
    blurb: 'Disturbances in the quality, timing, or amount of sleep that cause daytime distress or impairment.',
    disorders: [
      {
        name: 'Insomnia Disorder',
        cues: ['Difficulty initiating or maintaining sleep', 'At least 3 nights/week for 3 months', 'Daytime impairment'],
        vignette: 'For four months, a teacher takes 90 minutes to fall asleep and wakes at 3 a.m., struggling through her days.',
      },
      {
        name: 'Hypersomnolence Disorder',
        cues: ['Excessive sleepiness despite a main sleep period of at least 7 hours', 'Recurrent lapses into sleep or unrefreshing long sleep'],
        vignette: 'A man sleeps 10 hours nightly, naps twice daily, and still feels foggy.',
      },
      {
        name: 'Narcolepsy',
        cues: ['Recurrent irrepressible need to sleep', 'Cataplexy and/or hypocretin deficiency and/or REM onset findings'],
        vignette: 'A college student suddenly falls asleep mid-conversation and briefly loses muscle tone when she laughs hard.',
      },
      {
        name: 'Nightmare Disorder',
        cues: ['Repeated awakenings from disturbing dreams', 'Rapid orientation upon awakening', 'Significant distress or impairment'],
        vignette: 'A trauma survivor wakes screaming from vivid dreams several nights a week and dreads going to bed.',
      },
      {
        name: 'Restless Legs Syndrome',
        cues: ['Urge to move the legs, especially at rest in the evening', 'Relieved by movement', 'Disrupts sleep'],
        vignette: 'Every evening a woman feels a crawling urge in her calves that only walking relieves, ruining her sleep.',
      },
    ],
  },
  {
    id: 'sexual',
    name: 'Sexual Dysfunctions',
    short: 'Sexual',
    color: '#FF71CE',
    blurb: 'A heterogeneous group of disorders typified by a clinically significant disturbance in a person\'s ability to respond sexually or experience sexual pleasure.',
    disorders: [
      {
        name: 'Erectile Disorder',
        cues: ['Difficulty obtaining or maintaining erection during partnered activity', 'Symptoms 6+ months', 'Cause distress'],
        vignette: 'For over a year a man has been unable to maintain an erection in nearly all partnered encounters, with no clear medical cause.',
      },
      {
        name: 'Female Orgasmic Disorder',
        cues: ['Marked delay, infrequency, or absence of orgasm', 'Or markedly reduced intensity', 'On almost all occasions for 6+ months'],
        vignette: 'A woman in a stable relationship has never reliably reached orgasm with her partner for over a year despite adequate stimulation.',
      },
      {
        name: 'Premature (Early) Ejaculation',
        cues: ['Ejaculation within about a minute of vaginal penetration', 'Before person wishes', 'Symptoms 6+ months'],
        vignette: 'A man ejaculates within 30 seconds of partnered intercourse and finds this distressing.',
      },
      {
        name: 'Genito-Pelvic Pain/Penetration Disorder',
        cues: ['Difficulty with vaginal penetration', 'Pain during attempts', 'Fear or pelvic floor tightening'],
        vignette: 'A young woman experiences burning pain on attempted penetration and tenses her pelvic floor in anticipation.',
      },
    ],
  },
  {
    id: 'gender',
    name: 'Gender Dysphoria',
    short: 'Gender',
    color: '#FF71CE',
    blurb: 'Distress that accompanies the incongruence between a person\'s experienced/expressed gender and their assigned gender.',
    disorders: [
      {
        name: 'Gender Dysphoria',
        cues: ['Marked incongruence between experienced and assigned gender for at least 6 months', 'Clinically significant distress or impairment'],
        vignette: 'A teenager assigned female at birth has, for years, felt and asked to be recognized as a boy; the mismatch causes severe distress.',
      },
    ],
  },
  {
    id: 'disruptive',
    name: 'Disruptive, Impulse-Control & Conduct Disorders',
    short: 'Disruptive',
    color: '#FF0040',
    blurb: 'Conditions involving problems in the self-control of emotions and behaviors, often violating the rights of others or bringing the person into conflict with social norms.',
    disorders: [
      {
        name: 'Oppositional Defiant Disorder',
        cues: ['Angry/irritable mood, argumentative/defiant behavior, vindictiveness', 'At least 6 months', 'Beyond developmentally expected'],
        vignette: 'For nearly a year, an 8-year-old loses his temper daily, argues with adults, and refuses to comply with simple requests.',
      },
      {
        name: 'Conduct Disorder',
        cues: ['Repetitive violation of the rights of others or major age-appropriate societal norms', 'Aggression, destruction, deceit, serious rule violations'],
        vignette: 'A 14-year-old has bullied peers, broken into homes, started fires, and stayed out all night despite consequences for over a year.',
      },
      {
        name: 'Intermittent Explosive Disorder',
        cues: ['Recurrent behavioral outbursts grossly out of proportion to provocation', 'Not premeditated'],
        vignette: 'A 28-year-old has unprovoked explosive outbursts twice a week — screaming, smashing objects — then calms quickly and is remorseful.',
      },
      {
        name: 'Kleptomania',
        cues: ['Recurrent failure to resist impulses to steal items not needed', 'Tension before and relief during the theft'],
        vignette: 'A woman steals trivial items from stores despite being wealthy, feeling rising tension before and brief release after.',
      },
      {
        name: 'Pyromania',
        cues: ['Deliberate and purposeful fire setting on more than one occasion', 'Fascination with fire', 'Tension before and gratification after'],
        vignette: 'A man sets brush fires he watches from a distance, drawn by tension that builds until he lights one.',
      },
    ],
  },
  {
    id: 'substance',
    name: 'Substance-Related & Addictive Disorders',
    short: 'Substance',
    color: '#FFD700',
    blurb: 'Disorders related to the taking of a drug of abuse, the side effects of a medication, and toxin exposure — plus non-substance addictive behaviors.',
    disorders: [
      {
        name: 'Alcohol Use Disorder',
        cues: ['Problematic pattern of alcohol use', 'At least 2 of 11 criteria over 12 months (e.g., tolerance, withdrawal, loss of control, use despite harm)'],
        vignette: 'A 35-year-old drinks daily, has tried unsuccessfully to cut down, drinks despite job warnings, and shakes mornings she does not drink.',
      },
      {
        name: 'Opioid Use Disorder',
        cues: ['Problematic pattern of opioid use', 'Tolerance, withdrawal, craving, role failure'],
        vignette: 'After a back injury, a patient escalates her opioid use, doctor-shops, neglects her children, and gets sick when she runs out.',
      },
      {
        name: 'Stimulant Use Disorder',
        cues: ['Problematic use of amphetamine-type or cocaine-type stimulants', 'Tolerance, craving, social impairment'],
        vignette: 'A young man binges on cocaine across long weekends, missing work, and cannot cut back despite trying.',
      },
      {
        name: 'Cannabis Use Disorder',
        cues: ['Problematic cannabis use', 'Continued use despite consequences', 'Tolerance, withdrawal'],
        vignette: 'A college student smokes throughout the day, has dropped two classes, and gets irritable and sleepless on days he tries to stop.',
      },
      {
        name: 'Tobacco Use Disorder',
        cues: ['Problematic tobacco use', 'Tolerance, withdrawal, multiple failed attempts to quit'],
        vignette: 'A 50-year-old has smoked a pack a day for 30 years, has emphysema, has tried to quit five times, and feels jittery hours without a cigarette.',
      },
      {
        name: 'Gambling Disorder',
        cues: ['Persistent and recurrent problematic gambling behavior', 'At least 4 of 9 criteria in 12 months', 'Only non-substance addictive disorder in DSM-5-TR'],
        vignette: 'A man has lost his savings chasing losses at the casino, lied to his wife about it, and cannot stop despite serious consequences.',
      },
    ],
  },
  {
    id: 'neurocognitive',
    name: 'Neurocognitive Disorders',
    short: 'Neurocognitive',
    color: '#9966FF',
    blurb: 'Acquired (not developmental) decline in one or more cognitive domains, ranging from delirium through mild to major neurocognitive impairment.',
    disorders: [
      {
        name: 'Delirium',
        cues: ['Disturbance in attention and awareness', 'Acute onset, fluctuating course', 'Caused by an underlying medical/substance condition'],
        vignette: 'A hospitalized 80-year-old becomes acutely disoriented at sundown, attention waxing and waning, hallucinating insects on the wall.',
      },
      {
        name: 'Major Neurocognitive Disorder (Alzheimer\'s type)',
        cues: ['Significant cognitive decline in one or more domains', 'Interferes with independence', 'Gradual insidious onset, progressive'],
        vignette: 'A 75-year-old has gradually lost the ability to recall recent events, manage finances, or recognize close friends over two years.',
      },
      {
        name: 'Mild Neurocognitive Disorder',
        cues: ['Modest cognitive decline', 'Does not interfere with capacity for independence', 'Often compensated for'],
        vignette: 'A 68-year-old notices and others confirm she is more forgetful and slower, but still manages her household and finances with effort.',
      },
      {
        name: 'Vascular Neurocognitive Disorder',
        cues: ['Cognitive decline temporally tied to cerebrovascular events', 'Often stepwise progression'],
        vignette: 'After two small strokes, a patient\'s cognition declined in clear steps rather than gradually.',
      },
      {
        name: 'Neurocognitive Disorder With Lewy Bodies',
        cues: ['Fluctuating cognition', 'Recurrent visual hallucinations', 'Parkinsonian features'],
        vignette: 'A 72-year-old fluctuates between lucidity and confusion daily, sees vivid children in his living room, and has a shuffling gait.',
      },
      {
        name: 'Frontotemporal Neurocognitive Disorder',
        cues: ['Early behavioral/personality changes or language decline', 'Relative sparing of memory early on'],
        vignette: 'A 58-year-old previously reserved has become coarsely disinhibited, makes inappropriate jokes, and overeats sweets — memory still mostly intact.',
      },
    ],
  },
  {
    id: 'personality',
    name: 'Personality Disorders',
    short: 'Personality',
    color: '#FF71CE',
    blurb: 'Enduring patterns of inner experience and behavior that deviate markedly from cultural expectations, are pervasive and inflexible, stable over time, and lead to distress or impairment.',
    disorders: [
      {
        name: 'Paranoid Personality Disorder (Cluster A)',
        cues: ['Pervasive distrust and suspiciousness of others\' motives'],
        vignette: 'A man assumes co-workers conspire against him, reads slights into neutral comments, and refuses to confide in anyone.',
      },
      {
        name: 'Schizoid Personality Disorder (Cluster A)',
        cues: ['Pervasive detachment from social relationships', 'Restricted emotional expression'],
        vignette: 'A woman has no close relationships outside immediate family, prefers solitary activities, and shows little emotion.',
      },
      {
        name: 'Schizotypal Personality Disorder (Cluster A)',
        cues: ['Social/interpersonal deficits, cognitive/perceptual distortions, eccentricities'],
        vignette: 'A man believes minor coincidences are personal omens, dresses oddly, and has few friends; his speech is vague and over-elaborate.',
      },
      {
        name: 'Antisocial Personality Disorder (Cluster B)',
        cues: ['Disregard for and violation of rights of others since age 15', 'Adult at least 18, evidence of conduct disorder before age 15'],
        vignette: 'A 30-year-old with a long history since childhood of lying, stealing, fighting, and reckless disregard for safety — without remorse.',
      },
      {
        name: 'Borderline Personality Disorder (Cluster B)',
        cues: ['Pervasive instability in relationships, self-image, and affect', 'Marked impulsivity', 'Fear of abandonment, recurrent self-harm or suicidality'],
        vignette: 'A young woman has chaotic relationships that shift between idealization and devaluation, frequent suicidal gestures, and an unstable sense of self.',
      },
      {
        name: 'Histrionic Personality Disorder (Cluster B)',
        cues: ['Pervasive excessive emotionality and attention seeking'],
        vignette: 'A man dresses provocatively, dramatizes minor events, and is uncomfortable unless he is the center of attention.',
      },
      {
        name: 'Narcissistic Personality Disorder (Cluster B)',
        cues: ['Grandiosity', 'Need for admiration', 'Lack of empathy'],
        vignette: 'An executive exaggerates her achievements, expects special treatment, envies others, and dismisses subordinates as beneath her.',
      },
      {
        name: 'Avoidant Personality Disorder (Cluster C)',
        cues: ['Social inhibition', 'Feelings of inadequacy', 'Hypersensitivity to negative evaluation'],
        vignette: 'A man longs for relationships but avoids them because he is certain he will be ridiculed or rejected.',
      },
      {
        name: 'Dependent Personality Disorder (Cluster C)',
        cues: ['Excessive need to be taken care of', 'Submissive and clinging behavior', 'Fears of separation'],
        vignette: 'A woman cannot make even minor decisions without reassurance, tolerates a controlling partner, and panics at the thought of being alone.',
      },
      {
        name: 'Obsessive-Compulsive Personality Disorder (Cluster C)',
        cues: ['Preoccupation with orderliness, perfectionism, and control', 'At the expense of flexibility, openness, and efficiency'],
        vignette: 'An accountant cannot delegate, is so focused on rules and minor details that projects stall, and is rigid about morality and money.',
      },
    ],
  },
  {
    id: 'paraphilic',
    name: 'Paraphilic Disorders',
    short: 'Paraphilic',
    color: '#B967DB',
    blurb: 'Atypical sexual interests that cause distress to the individual or harm to others.',
    disorders: [
      {
        name: 'Voyeuristic Disorder',
        cues: ['Sexual arousal from observing an unsuspecting person who is naked or engaged in sexual activity', 'Acted on with a non-consenting person or causes distress'],
        vignette: 'A 25-year-old has for years been arousing himself by secretly watching neighbors through windows.',
      },
      {
        name: 'Exhibitionistic Disorder',
        cues: ['Sexual arousal from exposing one\'s genitals to an unsuspecting person', 'Acted on with a non-consenting person or causes distress'],
        vignette: 'A man repeatedly exposes himself to passersby in parks for sexual gratification.',
      },
      {
        name: 'Frotteuristic Disorder',
        cues: ['Sexual arousal from touching or rubbing against a non-consenting person'],
        vignette: 'A commuter repeatedly presses against strangers on crowded trains for sexual gratification.',
      },
      {
        name: 'Pedophilic Disorder',
        cues: ['Recurrent sexual arousal involving prepubescent children', 'Person is at least 16 and at least 5 years older', 'Acted on or causes marked distress/interpersonal difficulty'],
        vignette: 'A 30-year-old has persistent sexual fantasies focused on prepubescent children that cause him intense distress.',
      },
      {
        name: 'Fetishistic Disorder',
        cues: ['Recurrent arousal from a nonliving object or specific non-genital body part', 'Clinically significant distress or impairment'],
        vignette: 'A man can only become aroused in the presence of a specific type of leather glove; his relationships have ended over it.',
      },
    ],
  },
];

// Flatten for quick lookups (disorder name -> category id).
export const DISORDER_INDEX = (() => {
  const map = [];
  for (const cat of CATEGORIES) {
    for (const d of cat.disorders) {
      map.push({ ...d, categoryId: cat.id, categoryName: cat.name, categoryShort: cat.short, color: cat.color });
    }
  }
  return map;
})();

// Trivia stingers — short, accurate, public facts about the manual itself.
// Used between rounds for color and reinforcement.
export const FACTS = [
  'The DSM-5 was published in 2013; the DSM-5-TR (Text Revision) followed in 2022.',
  'DSM-5-TR added Prolonged Grief Disorder as a new diagnosis.',
  'Gambling Disorder is the only behavioral (non-substance) addictive disorder included in DSM-5-TR.',
  'Asperger\'s Disorder was folded into Autism Spectrum Disorder beginning with DSM-5.',
  'Personality disorders are grouped into three clusters: A (odd/eccentric), B (dramatic/erratic), and C (anxious/fearful).',
  'A manic episode in Bipolar I must last at least one week — or any duration if hospitalization is required.',
  'Major Depressive Disorder requires at least five symptoms for at least two weeks, including depressed mood or loss of interest.',
  'PTSD now lives in its own chapter — Trauma- and Stressor-Related Disorders — rather than with Anxiety Disorders.',
  'Hoarding Disorder became a standalone diagnosis in DSM-5, separate from OCD.',
  'Gender Dysphoria replaced the older diagnosis "Gender Identity Disorder," and the diagnosis is about distress from incongruence — not gender identity itself.',
  'Homosexuality was removed from the DSM in 1973 and the residual "ego-dystonic homosexuality" was removed in 1987.',
  'Schizophrenia subtypes (paranoid, disorganized, catatonic, etc.) were dropped beginning with DSM-5.',
  'DSM-5-TR introduced suicidal behavior and nonsuicidal self-injury as conditions for further study.',
];
