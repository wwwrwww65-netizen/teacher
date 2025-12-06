export const lessons = [
    {
        id: 1,
        title: 'الحروف الأبجدية',
        titleEn: 'Alphabet',
        description: 'تعلم الحروف من A إلى Z',
        icon: '🔤',
        level: 'beginner',
        duration: '10 دقائق',
        topics: [
            {
                id: 1,
                title: 'حرف A',
                content: 'هذا حرف A. A is for Apple.',
                draw: 'M50 150 L100 50 L150 150 M75 110 L125 110',
                question: 'ما هو الحرف الذي تعلمناه؟',
                keywords: ['A', 'ايه', 'ألف', 'apple'],
                successResponse: 'ممتاز! هذا حرف A.',
                failResponse: 'حاول مرة أخرى، هذا حرف A.'
            },
            {
                id: 2,
                title: 'حرف B',
                content: 'هذا حرف B. B is for Ball.',
                draw: 'M50 50 L50 150 L100 150 Q130 130 100 100 Q130 70 100 50 Z',
                question: 'ما هذا الحرف؟',
                keywords: ['B', 'بي', 'باء', 'ball'],
                successResponse: 'أحسنت! حرف B.',
                failResponse: 'لا، هذا حرف B.'
            },
        ],
    },
    {
        id: 2,
        title: 'الأرقام',
        titleEn: 'Numbers',
        description: 'تعلم العد من 1 إلى 10',
        icon: '🔢',
        level: 'beginner',
        duration: '8 دقائق',
        topics: [
            {
                id: 1,
                title: 'رقم 1',
                content: 'هذا رقم واحد. تفاحة واحدة.',
                draw: 'M100 50 L100 150', // رسم رقم 1
                question: 'كم تفاحة موجودة؟',
                keywords: ['واحد', 'one', '1'],
                successResponse: 'صحيح! تفاحة واحدة.',
                failResponse: 'انظر جيداً، إنها واحدة فقط.'
            },
            {
                id: 2,
                title: 'رقم 2',
                content: 'هذا رقم اثنان. كرتان.',
                draw: 'M50 50 Q150 50 150 80 L50 150 L150 150', // رسم رقم 2
                question: 'ما هو الرقم التالي؟',
                keywords: ['اثنان', 'اثنين', 'two', '2'],
                successResponse: 'رائع! رقم اثنان.',
                failResponse: 'إنه رقم اثنان.'
            },
        ],
    },
];
