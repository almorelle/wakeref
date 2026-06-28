-- Migration 0009 — seed des alias parlés (figures.aliases)
--
-- GÉNÉRÉ par scripts/gen-aliases.mjs — NE PAS éditer à la main (rejouer le script).
-- Périmètre : kicker / air tricks (hors jib). ÉCRASE aliases des figures listées.
-- À exécuter dans l'éditeur SQL Supabase, APRÈS la migration 0008.
--
-- 174 figures couvertes (48 via combinatoire spin, 126 via surnoms nommés).

-- BS 180
update public.figures set aliases = '{"un back","one back","1 back","180 back","back un","back one","back 1","back 180"}'::text[] where slug = 'seated-bs-180';
-- Fakie BS 180
update public.figures set aliases = '{"fakie un back","fakie one back","fakie 1 back","fakie 180 back","fakie back un","fakie back one","fakie back 1","fakie back 180"}'::text[] where slug = 'seated-fakie-bs-180';
-- Fakie FS 180
update public.figures set aliases = '{"fakie un","fakie one","fakie 1","fakie 180","fakie un front","fakie one front","fakie 1 front","fakie 180 front","fakie front un","fakie front one","fakie front 1","fakie front 180"}'::text[] where slug = 'seated-fakie-fs-180';
-- FS 180
update public.figures set aliases = '{"un","one","1","180","un front","one front","1 front","180 front","front un","front one","front 1","front 180"}'::text[] where slug = 'seated-fs-180';
-- HS BS 180
update public.figures set aliases = '{"un back","one back","1 back","180 back","back un","back one","back 1","back 180"}'::text[] where slug = 'hs-bs-180';
-- HS FS 180
update public.figures set aliases = '{"un","one","1","180","un front","one front","1 front","180 front","front un","front one","front 1","front 180"}'::text[] where slug = 'hs-fs-180';
-- Ollie 180
update public.figures set aliases = '{"ollie un","ollie one","ollie 1","ollie 180","ollie un front","ollie one front","ollie 1 front","ollie 180 front","ollie front un","ollie front one","ollie front 1","ollie front 180"}'::text[] where slug = 'ollie-180';
-- Ollie BS 180
update public.figures set aliases = '{"ollie un back","ollie one back","ollie 1 back","ollie 180 back","ollie back un","ollie back one","ollie back 1","ollie back 180"}'::text[] where slug = 'ollie-bs-180';
-- TS BS 180
update public.figures set aliases = '{"toe un back","toe one back","toe 1 back","toe 180 back","toe back un","toe back one","toe back 1","toe back 180","toeside un back","toeside one back","toeside 1 back","toeside 180 back","toeside back un","toeside back one","toeside back 1","toeside back 180"}'::text[] where slug = 'ts-bs-180';
-- TS FS 180
update public.figures set aliases = '{"toe un","toe one","toe 1","toe 180","toe un front","toe one front","toe 1 front","toe 180 front","toe front un","toe front one","toe front 1","toe front 180","toeside un","toeside one","toeside 1","toeside 180","toeside un front","toeside one front","toeside 1 front","toeside 180 front","toeside front un","toeside front one","toeside front 1","toeside front 180"}'::text[] where slug = 'ts-fs-180';
-- BS 360
update public.figures set aliases = '{"trois back","three back","3 back","360 back","back trois","back three","back 3","back 360"}'::text[] where slug = 'seated-bs-360';
-- Fakie BS 360
update public.figures set aliases = '{"fakie trois back","fakie three back","fakie 3 back","fakie 360 back","fakie back trois","fakie back three","fakie back 3","fakie back 360"}'::text[] where slug = 'seated-fakie-bs-360';
-- Fakie FS 360
update public.figures set aliases = '{"fakie trois","fakie three","fakie 3","fakie 360","fakie trois front","fakie three front","fakie 3 front","fakie 360 front","fakie front trois","fakie front three","fakie front 3","fakie front 360"}'::text[] where slug = 'seated-fakie-fs-360';
-- FS 360
update public.figures set aliases = '{"trois","three","3","360","trois front","three front","3 front","360 front","front trois","front three","front 3","front 360"}'::text[] where slug = 'seated-fs-360';
-- HS BS 360
update public.figures set aliases = '{"trois back","three back","3 back","360 back","back trois","back three","back 3","back 360"}'::text[] where slug = 'hs-bs-360';
-- HS FS 360
update public.figures set aliases = '{"trois","three","3","360","trois front","three front","3 front","360 front","front trois","front three","front 3","front 360"}'::text[] where slug = 'hs-fs-360';
-- Ollie 360
update public.figures set aliases = '{"ollie trois","ollie three","ollie 3","ollie 360","ollie trois front","ollie three front","ollie 3 front","ollie 360 front","ollie front trois","ollie front three","ollie front 3","ollie front 360"}'::text[] where slug = 'ollie-360';
-- Ollie BS 360
update public.figures set aliases = '{"ollie trois back","ollie three back","ollie 3 back","ollie 360 back","ollie back trois","ollie back three","ollie back 3","ollie back 360"}'::text[] where slug = 'ollie-bs-360';
-- TS BS 360
update public.figures set aliases = '{"toe trois back","toe three back","toe 3 back","toe 360 back","toe back trois","toe back three","toe back 3","toe back 360","toeside trois back","toeside three back","toeside 3 back","toeside 360 back","toeside back trois","toeside back three","toeside back 3","toeside back 360"}'::text[] where slug = 'ts-bs-360';
-- TS FS 360
update public.figures set aliases = '{"toe trois","toe three","toe 3","toe 360","toe trois front","toe three front","toe 3 front","toe 360 front","toe front trois","toe front three","toe front 3","toe front 360","toeside trois","toeside three","toeside 3","toeside 360","toeside trois front","toeside three front","toeside 3 front","toeside 360 front","toeside front trois","toeside front three","toeside front 3","toeside front 360"}'::text[] where slug = 'ts-fs-360';
-- BS 540
update public.figures set aliases = '{"cinq back","five back","5 back","540 back","back cinq","back five","back 5","back 540"}'::text[] where slug = 'seated-bs-540';
-- Fakie BS 540
update public.figures set aliases = '{"fakie cinq back","fakie five back","fakie 5 back","fakie 540 back","fakie back cinq","fakie back five","fakie back 5","fakie back 540"}'::text[] where slug = 'seated-fakie-bs-540';
-- Fakie FS 540
update public.figures set aliases = '{"fakie cinq","fakie five","fakie 5","fakie 540","fakie cinq front","fakie five front","fakie 5 front","fakie 540 front","fakie front cinq","fakie front five","fakie front 5","fakie front 540"}'::text[] where slug = 'seated-fakie-fs-540';
-- FS 540
update public.figures set aliases = '{"cinq","five","5","540","cinq front","five front","5 front","540 front","front cinq","front five","front 5","front 540"}'::text[] where slug = 'seated-fs-540';
-- HS BS 540
update public.figures set aliases = '{"cinq back","five back","5 back","540 back","back cinq","back five","back 5","back 540"}'::text[] where slug = 'hs-bs-540';
-- HS FS 540
update public.figures set aliases = '{"cinq","five","5","540","cinq front","five front","5 front","540 front","front cinq","front five","front 5","front 540"}'::text[] where slug = 'hs-fs-540';
-- TS BS 540
update public.figures set aliases = '{"toe cinq back","toe five back","toe 5 back","toe 540 back","toe back cinq","toe back five","toe back 5","toe back 540","toeside cinq back","toeside five back","toeside 5 back","toeside 540 back","toeside back cinq","toeside back five","toeside back 5","toeside back 540"}'::text[] where slug = 'ts-bs-540';
-- TS FS 540
update public.figures set aliases = '{"toe cinq","toe five","toe 5","toe 540","toe cinq front","toe five front","toe 5 front","toe 540 front","toe front cinq","toe front five","toe front 5","toe front 540","toeside cinq","toeside five","toeside 5","toeside 540","toeside cinq front","toeside five front","toeside 5 front","toeside 540 front","toeside front cinq","toeside front five","toeside front 5","toeside front 540"}'::text[] where slug = 'ts-fs-540';
-- HS BS 720
update public.figures set aliases = '{"sept back","seven back","7 back","720 back","back sept","back seven","back 7","back 720"}'::text[] where slug = 'hs-bs-720';
-- HS FS 720
update public.figures set aliases = '{"sept","seven","7","720","sept front","seven front","7 front","720 front","front sept","front seven","front 7","front 720"}'::text[] where slug = 'hs-fs-720';
-- TS BS 720
update public.figures set aliases = '{"toe sept back","toe seven back","toe 7 back","toe 720 back","toe back sept","toe back seven","toe back 7","toe back 720","toeside sept back","toeside seven back","toeside 7 back","toeside 720 back","toeside back sept","toeside back seven","toeside back 7","toeside back 720"}'::text[] where slug = 'ts-bs-720';
-- TS FS 720
update public.figures set aliases = '{"toe sept","toe seven","toe 7","toe 720","toe sept front","toe seven front","toe 7 front","toe 720 front","toe front sept","toe front seven","toe front 7","toe front 720","toeside sept","toeside seven","toeside 7","toeside 720","toeside sept front","toeside seven front","toeside 7 front","toeside 720 front","toeside front sept","toeside front seven","toeside front 7","toeside front 720"}'::text[] where slug = 'ts-fs-720';
-- HS BS 900
update public.figures set aliases = '{"neuf back","nine back","9 back","900 back","back neuf","back nine","back 9","back 900"}'::text[] where slug = 'hs-bs-900';
-- HS FS 900
update public.figures set aliases = '{"neuf","nine","9","900","neuf front","nine front","9 front","900 front","front neuf","front nine","front 9","front 900"}'::text[] where slug = 'hs-fs-900';
-- TS BS 900
update public.figures set aliases = '{"toe neuf back","toe nine back","toe 9 back","toe 900 back","toe back neuf","toe back nine","toe back 9","toe back 900","toeside neuf back","toeside nine back","toeside 9 back","toeside 900 back","toeside back neuf","toeside back nine","toeside back 9","toeside back 900"}'::text[] where slug = 'ts-bs-900';
-- TS FS 900
update public.figures set aliases = '{"toe neuf","toe nine","toe 9","toe 900","toe neuf front","toe nine front","toe 9 front","toe 900 front","toe front neuf","toe front nine","toe front 9","toe front 900","toeside neuf","toeside nine","toeside 9","toeside 900","toeside neuf front","toeside nine front","toeside 9 front","toeside 900 front","toeside front neuf","toeside front nine","toeside front 9","toeside front 900"}'::text[] where slug = 'ts-fs-900';
-- HS BS 1080
update public.figures set aliases = '{"dix back","mille back","ten back","10 back","1080 back","back dix","back mille","back ten","back 10","back 1080"}'::text[] where slug = 'hs-bs-1080';
-- HS FS 1080
update public.figures set aliases = '{"dix","mille","ten","10","1080","dix front","mille front","ten front","10 front","1080 front","front dix","front mille","front ten","front 10","front 1080"}'::text[] where slug = 'hs-fs-1080';
-- TS BS 1080
update public.figures set aliases = '{"toe dix back","toe mille back","toe ten back","toe 10 back","toe 1080 back","toe back dix","toe back mille","toe back ten","toe back 10","toe back 1080","toeside dix back","toeside mille back","toeside ten back","toeside 10 back","toeside 1080 back","toeside back dix","toeside back mille","toeside back ten","toeside back 10","toeside back 1080"}'::text[] where slug = 'ts-bs-1080';
-- TS FS 1080
update public.figures set aliases = '{"toe dix","toe mille","toe ten","toe 10","toe 1080","toe dix front","toe mille front","toe ten front","toe 10 front","toe 1080 front","toe front dix","toe front mille","toe front ten","toe front 10","toe front 1080","toeside dix","toeside mille","toeside ten","toeside 10","toeside 1080","toeside dix front","toeside mille front","toeside ten front","toeside 10 front","toeside 1080 front","toeside front dix","toeside front mille","toeside front ten","toeside front 10","toeside front 1080"}'::text[] where slug = 'ts-fs-1080';
-- HS BS 1260
update public.figures set aliases = '{"douze back","twelve back","12 back","1260 back","back douze","back twelve","back 12","back 1260"}'::text[] where slug = 'hs-bs-1260';
-- HS FS 1260
update public.figures set aliases = '{"douze","twelve","12","1260","douze front","twelve front","12 front","1260 front","front douze","front twelve","front 12","front 1260"}'::text[] where slug = 'hs-fs-1260';
-- TS BS 1260
update public.figures set aliases = '{"toe douze back","toe twelve back","toe 12 back","toe 1260 back","toe back douze","toe back twelve","toe back 12","toe back 1260","toeside douze back","toeside twelve back","toeside 12 back","toeside 1260 back","toeside back douze","toeside back twelve","toeside back 12","toeside back 1260"}'::text[] where slug = 'ts-bs-1260';
-- TS FS 1260
update public.figures set aliases = '{"toe douze","toe twelve","toe 12","toe 1260","toe douze front","toe twelve front","toe 12 front","toe 1260 front","toe front douze","toe front twelve","toe front 12","toe front 1260","toeside douze","toeside twelve","toeside 12","toeside 1260","toeside douze front","toeside twelve front","toeside 12 front","toeside 1260 front","toeside front douze","toeside front twelve","toeside front 12","toeside front 1260"}'::text[] where slug = 'ts-fs-1260';
-- HS BS 1440
update public.figures set aliases = '{"quatorze back","fourteen back","14 back","1440 back","back quatorze","back fourteen","back 14","back 1440"}'::text[] where slug = 'hs-bs-1440';
-- HS FS 1440
update public.figures set aliases = '{"quatorze","fourteen","14","1440","quatorze front","fourteen front","14 front","1440 front","front quatorze","front fourteen","front 14","front 1440"}'::text[] where slug = 'hs-fs-1440';
-- TS BS 1440
update public.figures set aliases = '{"toe quatorze back","toe fourteen back","toe 14 back","toe 1440 back","toe back quatorze","toe back fourteen","toe back 14","toe back 1440","toeside quatorze back","toeside fourteen back","toeside 14 back","toeside 1440 back","toeside back quatorze","toeside back fourteen","toeside back 14","toeside back 1440"}'::text[] where slug = 'ts-bs-1440';
-- TS FS 1440
update public.figures set aliases = '{"toe quatorze","toe fourteen","toe 14","toe 1440","toe quatorze front","toe fourteen front","toe 14 front","toe 1440 front","toe front quatorze","toe front fourteen","toe front 14","toe front 1440","toeside quatorze","toeside fourteen","toeside 14","toeside 1440","toeside quatorze front","toeside fourteen front","toeside 14 front","toeside 1440 front","toeside front quatorze","toeside front fourteen","toeside front 14","toeside front 1440"}'::text[] where slug = 'ts-fs-1440';
-- 911
update public.figures set aliases = '{"nine eleven","neuf onze"}'::text[] where slug = '911';
-- Hoochie Glide
update public.figures set aliases = '{"hoochie"}'::text[] where slug = 'hoochie-glide';
-- Indy Glide
update public.figures set aliases = '{"indy glide"}'::text[] where slug = 'indy-glide';
-- OHH
update public.figures set aliases = '{"o h h"}'::text[] where slug = 'ohh';
-- Railey
update public.figures set aliases = '{"railey","really","rallye","raleigh","rayleigh","raylet"}'::text[] where slug = 'railey';
-- TS Railey
update public.figures set aliases = '{"toe railey","toeside railey","toe rallye","toe really","toe raleigh","toe rayleigh","toe raylet"}'::text[] where slug = 'ts-railey';
-- Blind Judge
update public.figures set aliases = '{"blind judge","railey blind","rallye blind","really blind","rae blind","ready blind","railey to blind"}'::text[] where slug = 'blind-judge';
-- Butter Fuko
update public.figures set aliases = '{"butter"}'::text[] where slug = 'butter-fuko';
-- Railey Krypt
update public.figures set aliases = '{"railey krypt","krypt","crypt","egypt","railey egypt","railey crypt","rayleigh crypt","rayleigh krypt"}'::text[] where slug = 'krypt';
-- TS Blind Judge
update public.figures set aliases = '{"toe blind judge","toe railey blind","toe rallye blind"}'::text[] where slug = 'ts-blind-judge';
-- TS Railey Krypt
update public.figures set aliases = '{"toe krypt","toe crypt","toe egypt"}'::text[] where slug = 'ts-krypt';
-- 313
update public.figures set aliases = '{"trois treize","three thirteen","313","3 13","trois 13","three 13","360 13"}'::text[] where slug = '313';
-- 313 Rewind
update public.figures set aliases = '{"trois treize rewind","313 rewind"}'::text[] where slug = '313-rewind';
-- BS 313
update public.figures set aliases = '{"back trois treize","trois treize back","313 back","back 313"}'::text[] where slug = 'bs-313';
-- BS 313 Rewind
update public.figures set aliases = '{"back trois treize rewind","313 back rewind"}'::text[] where slug = 'bs-313-rewind';
-- Rubber Chicken
update public.figures set aliases = '{"rubber chicken"}'::text[] where slug = 'rubber-chicken';
-- TS 313 / 90210
update public.figures set aliases = '{"toe trois treize","ninety two ten","ninety two dix","ninety two mille","ninety two 10","ninety two 1080","nine o two ten","neuf o two dix","neuf o two mille","neuf o two ten","neuf o two 10","neuf o two 1080","nine o two dix","nine o two mille","nine o two 10","nine o two 1080","9 o two dix","9 o two mille","9 o two ten","9 o two 10","9 o two 1080","900 o two dix","900 o two mille","900 o two ten","900 o two 10","900 o two 1080","toe 313","313 toe","90210"}'::text[] where slug = 'ts-313';
-- TS BS 313
update public.figures set aliases = '{"toe back trois treize","toe trois treize back","toe 313 back"}'::text[] where slug = 'ts-bs-313';
-- 315 / Nickelodeon
update public.figures set aliases = '{"trois quinze","three fifteen","nickelodeon","315","3 15","trois 15","three 15","360 15"}'::text[] where slug = '315';
-- BS 315
update public.figures set aliases = '{"back trois quinze","trois quinze back","315 back","back 315"}'::text[] where slug = 'bs-315';
-- TS 315
update public.figures set aliases = '{"toe trois quinze","toe 315","315 toe"}'::text[] where slug = 'ts-315';
-- 317
update public.figures set aliases = '{"trois dix-sept","three seventeen","317","3 17","trois 17","three 17","360 17"}'::text[] where slug = '317';
-- BS 317
update public.figures set aliases = '{"back trois dix-sept","trois dix-sept back","317 back","back 317"}'::text[] where slug = 'bs-317';
-- S-Bend
update public.figures set aliases = '{"sbend","s bend"}'::text[] where slug = 's-bend';
-- S-Mobe
update public.figures set aliases = '{"smobe","s mobe"}'::text[] where slug = 's-mobe';
-- S-Mobe 5
update public.figures set aliases = '{"smobe cinq","smobe five","smobe 5","smobe 540","s mobe cinq","s mobe five","s mobe 5","s mobe 540"}'::text[] where slug = 's-mobe-5';
-- S-Mobe Rewind
update public.figures set aliases = '{"s mobe rewind","smobe rewind"}'::text[] where slug = 's-mobe-rewind';
-- TS S-Bend
update public.figures set aliases = '{"toe sbend","toe s bend","toeside s bend"}'::text[] where slug = 'ts-s-bend';
-- S-Bend to Blind
update public.figures set aliases = '{"sbend blind","s bend blind"}'::text[] where slug = 's-bend-to-blind';
-- TS S-Bend to Blind
update public.figures set aliases = '{"toe s bend blind","toe sbend blind"}'::text[] where slug = 'ts-s-bend-to-blind';
-- Double S-Bend
update public.figures set aliases = '{"double sbend","double s bend"}'::text[] where slug = 'double-s-bend';
-- Double S-Bend to Blind
update public.figures set aliases = '{"double s bend blind","double sbend blind"}'::text[] where slug = 'double-s-bend-to-blind';
-- Heart Attack 5
update public.figures set aliases = '{"heart attack cinq","heart attack five","heart attack 5","heart attack 540"}'::text[] where slug = 'heart-attack-5';
-- Hinterberger
update public.figures set aliases = '{"hinter"}'::text[] where slug = 'hinterberger';
-- Hinterberger to Blind
update public.figures set aliases = '{"hinter blind","hinterberger blind"}'::text[] where slug = 'hinterberger-to-blind';
-- Hinterberger 5
update public.figures set aliases = '{"hinter cinq","hinter five","hinter 5","hinter 540","hinterberger five","hinterberger cinq","hinterberger 5","hinterberger 540"}'::text[] where slug = 'hinterberger-5';
-- 118 / Double Hinterberger
update public.figures set aliases = '{"cent dix-huit","one eighteen","un eighteen","1 eighteen","180 eighteen","double hinterberger"}'::text[] where slug = '118';
-- 118 900
update public.figures set aliases = '{"cent dix-huit neuf","cent dix-huit nine","cent dix-huit 9","cent dix-huit 900","118 neuf","118 nine","118 9","118 900","double hinterberger neuf","double hinterberger nine","double hinterberger 9","double hinterberger 900"}'::text[] where slug = '118-900';
-- Back Roll
update public.figures set aliases = '{"backroll"}'::text[] where slug = 'back-roll';
-- Double Back Roll
update public.figures set aliases = '{"double backroll"}'::text[] where slug = 'double-backroll';
-- Double TS Back Roll
update public.figures set aliases = '{"double toe backroll","double ts backroll"}'::text[] where slug = 'double-ts-back-roll';
-- TS Back Roll
update public.figures set aliases = '{"toe backroll","toeside backroll","ts backroll"}'::text[] where slug = 'ts-back-roll';
-- Double Back Roll to Revert
update public.figures set aliases = '{"double backroll revert","double back revert"}'::text[] where slug = 'double-backroll-to-revert';
-- Double Half Cab Roll
update public.figures set aliases = '{"double half cab","double halfcab"}'::text[] where slug = 'double-half-cab-roll';
-- Half Cab Roll
update public.figures set aliases = '{"half cab","halfcab","half cab roll"}'::text[] where slug = 'half-cab-roll';
-- Roll to Blind
update public.figures set aliases = '{"back blind","backroll blind","roll blind"}'::text[] where slug = 'roll-to-blind';
-- Roll to Revert
update public.figures set aliases = '{"back revert","backroll revert","roll revert"}'::text[] where slug = 'roll-to-revert';
-- TS Half Cab Roll
update public.figures set aliases = '{"toe half cab","toe halfcab","ts half cab"}'::text[] where slug = 'ts-half-cab-roll';
-- TS Roll to Blind
update public.figures set aliases = '{"toe back blind","toe roll to blind"}'::text[] where slug = 'ts-roll-to-blind';
-- TS Roll to Revert
update public.figures set aliases = '{"toe back revert","toe roll to revert"}'::text[] where slug = 'ts-roll-to-revert';
-- Back Mobe
update public.figures set aliases = '{"backmobe"}'::text[] where slug = 'back-mobe';
-- Big Mac
update public.figures set aliases = '{"big mac"}'::text[] where slug = 'big-mac';
-- Blind Pete
update public.figures set aliases = '{"blind pete"}'::text[] where slug = 'blind-pete';
-- Blind Pete Rose
update public.figures set aliases = '{"blind pete rose"}'::text[] where slug = 'blind-pete-rose';
-- Pete Rose
update public.figures set aliases = '{"pete rose"}'::text[] where slug = 'pete-rose';
-- Back Mobe 5
update public.figures set aliases = '{"back mobe cinq","back mobe five","back mobe 5","back mobe 540"}'::text[] where slug = 'back-mobe-5';
-- KGB 5
update public.figures set aliases = '{"kgb cinq","kgb five","kgb 5","kgb 540"}'::text[] where slug = 'kgb-5';
-- Pete Rose 5
update public.figures set aliases = '{"pete rose cinq","pete rose five","pete rose 5","pete rose 540"}'::text[] where slug = 'pete-rose-5';
-- Back Mobe 7
update public.figures set aliases = '{"back mobe sept","back mobe seven","back mobe 7","back mobe 720"}'::text[] where slug = 'back-mobe-7';
-- Pete Rose 7
update public.figures set aliases = '{"pete rose sept","pete rose seven","pete rose 7","pete rose 720"}'::text[] where slug = 'pete-rose-7';
-- Front Flip
update public.figures set aliases = '{"frontflip"}'::text[] where slug = 'front-flip';
-- Front Roll
update public.figures set aliases = '{"frontroll"}'::text[] where slug = 'front-roll';
-- Mexican Roll
update public.figures set aliases = '{"mexican"}'::text[] where slug = 'mexican-roll';
-- Front Flip to Blind
update public.figures set aliases = '{"front blind","frontflip blind","front flip blind"}'::text[] where slug = 'front-flip-to-blind';
-- Front Flip to Fakie
update public.figures set aliases = '{"front fakie","frontflip fakie"}'::text[] where slug = 'front-flip-to-fakie';
-- Mexican Roll to Revert
update public.figures set aliases = '{"mexican revert","mexican roll revert"}'::text[] where slug = 'mexican-roll-to-revert';
-- Crow Mobe
update public.figures set aliases = '{"crowmobe","crow mob","chrome mob","chrome mobe","chrome","chrome hub","col mab","gros mob","gross mob"}'::text[] where slug = 'crow-mobe';
-- Dum Dum
update public.figures set aliases = '{"dumdum"}'::text[] where slug = 'dum-dum';
-- East Mobe
update public.figures set aliases = '{"east mobe","eastmobe"}'::text[] where slug = 'east-mobe';
-- Front Blind Mobe
update public.figures set aliases = '{"front blind mobe"}'::text[] where slug = 'front-blind-mobe';
-- Slim Chance
update public.figures set aliases = '{"slim chance"}'::text[] where slug = 'slim-chance';
-- Crow Mobe 5
update public.figures set aliases = '{"crow mobe cinq","crow mobe five","crow mobe 5","crow mobe 540","crowmobe cinq","crowmobe five","crowmobe 5","crowmobe 540"}'::text[] where slug = 'crow-mobe-5';
-- Dum Dum 5
update public.figures set aliases = '{"dum dum cinq","dum dum five","dum dum 5","dum dum 540","dumdum cinq","dumdum five","dumdum 5","dumdum 540"}'::text[] where slug = 'dum-dum-5';
-- Slim Chance 5
update public.figures set aliases = '{"slim chance cinq","slim chance five","slim chance 5","slim chance 540"}'::text[] where slug = 'slim-chance-5';
-- Crow Mobe 7
update public.figures set aliases = '{"crow mobe sept","crow mobe seven","crow mobe 7","crow mobe 720"}'::text[] where slug = 'crow-mobe-7';
-- Double Tantrum
update public.figures set aliases = '{"double tan"}'::text[] where slug = 'double-tantrum';
-- Tantrum
update public.figures set aliases = '{"tan"}'::text[] where slug = 'tantrum';
-- Double Tantrum to Blind
update public.figures set aliases = '{"double tantrum blind","double tan blind"}'::text[] where slug = 'double-tantrum-to-blind';
-- Tantrum to Blind
update public.figures set aliases = '{"tantrum blind","tan blind","tan to blind"}'::text[] where slug = 'tantrum-to-blind';
-- Tantrum to Fakie
update public.figures set aliases = '{"tantrum fakie","tan fakie"}'::text[] where slug = 'tantrum-to-fakie';
-- Moby Dick
update public.figures set aliases = '{"moby","md"}'::text[] where slug = 'moby-dick';
-- Whirly Bird
update public.figures set aliases = '{"whirly"}'::text[] where slug = 'whirly-bird';
-- Moby Dick 5
update public.figures set aliases = '{"moby dick cinq","moby dick five","moby dick 5","moby dick 540","moby cinq","moby five","moby 5","moby 540","md cinq","md five","md 5","md 540"}'::text[] where slug = 'moby-dick-5';
-- Whirly 5
update public.figures set aliases = '{"whirly cinq","whirly five","whirly 5","whirly 540"}'::text[] where slug = 'whirly-5';
-- Moby Dick 7
update public.figures set aliases = '{"moby dick sept","moby dick seven","moby dick 7","moby dick 720","moby sept","moby seven","moby 7","moby 720","md sept","md seven","md 7","md 720"}'::text[] where slug = 'moby-dick-7';
-- Whirly 7 / Double Whirly
update public.figures set aliases = '{"whirly sept","whirly seven","whirly 7","whirly 720"}'::text[] where slug = 'whirly-7';
-- Whirly Dick
update public.figures set aliases = '{"whirly dick"}'::text[] where slug = 'whirly-dick';
-- Chicken Salad
update public.figures set aliases = '{"chickensalad"}'::text[] where slug = 'chicken-salad';
-- Nose Grab
update public.figures set aliases = '{"nose","nosegrab"}'::text[] where slug = 'nose-grab';
-- Roast Beef
update public.figures set aliases = '{"roastbeef"}'::text[] where slug = 'roast-beef';
-- Seat Belt
update public.figures set aliases = '{"seatbelt"}'::text[] where slug = 'seat-belt';
-- Stalefish
update public.figures set aliases = '{"stale fish"}'::text[] where slug = 'stalefish';
-- Tail Grab
update public.figures set aliases = '{"tail","tailgrab"}'::text[] where slug = 'tail-grab';
-- 360 Shove-it
update public.figures set aliases = '{"three sixty shuvit","trois sixty shuvit","3 sixty shuvit","360 sixty shuvit","360 shuvit","trois shuvit","three shuvit","3 shuvit","trois six shuvit","three six shuvit","3 six shuvit","360 six shuvit"}'::text[] where slug = 'ws-360-shuvit';
-- Pop Shove-it
update public.figures set aliases = '{"pop shuvit","pop shove it","pop shove"}'::text[] where slug = 'ws-pop-shuvit';
-- Shove-it
update public.figures set aliases = '{"shuvit","shove","shove it"}'::text[] where slug = 'ws-shuvit';
-- Big Spin
update public.figures set aliases = '{"big spin","bigspin"}'::text[] where slug = 'ws-big-spin';
-- Bigger Spin
update public.figures set aliases = '{"bigger spin","biggerspin"}'::text[] where slug = 'ws-bigger-spin';
-- Gazelle
update public.figures set aliases = '{"gazelle"}'::text[] where slug = 'ws-gazelle';
-- 360 Kickflip
update public.figures set aliases = '{"360 kickflip","trois kickflip","three kickflip","3 kickflip","three sixty kickflip","trois sixty kickflip","3 sixty kickflip","360 sixty kickflip","trois six kickflip","three six kickflip","3 six kickflip","360 six kickflip"}'::text[] where slug = 'ws-360-kickflip';
-- Bigflip
update public.figures set aliases = '{"big flip"}'::text[] where slug = 'ws-bigflip';
-- Fingerflip
update public.figures set aliases = '{"finger flip"}'::text[] where slug = 'ws-fingerflip';
-- Heelflip
update public.figures set aliases = '{"heel flip"}'::text[] where slug = 'ws-heelflip';
-- Kickflip
update public.figures set aliases = '{"kick flip"}'::text[] where slug = 'ws-kickflip';
-- Backside Kickflip
update public.figures set aliases = '{"backside kickflip","back kickflip","bs kickflip"}'::text[] where slug = 'ws-bs-kickflip';
-- Frontside Kickflip
update public.figures set aliases = '{"frontside kickflip","front kickflip","fs kickflip"}'::text[] where slug = 'ws-fs-kickflip';
-- Hardflip
update public.figures set aliases = '{"hard flip"}'::text[] where slug = 'ws-hardflip';
-- Sexchange
update public.figures set aliases = '{"sex change"}'::text[] where slug = 'ws-sexchange';
-- Varial Kickflip
update public.figures set aliases = '{"varial kickflip","varial flip","varial kick"}'::text[] where slug = 'ws-varial-kickflip';
-- Mute (Wakeskate)
update public.figures set aliases = '{"mute"}'::text[] where slug = 'ws-mute-special';
-- Bell Air
update public.figures set aliases = '{"bellair"}'::text[] where slug = 'bell-air';
-- Ben Air
update public.figures set aliases = '{"benair"}'::text[] where slug = 'ben-air';
-- Bell Air to Blind
update public.figures set aliases = '{"bell air blind","bellair blind"}'::text[] where slug = 'bell-air-to-blind';
-- Bell Air to Fakie
update public.figures set aliases = '{"bell air fakie","bellair fakie"}'::text[] where slug = 'bell-air-to-fakie';
-- Ben Air Tootsie
update public.figures set aliases = '{"ben air tootsie"}'::text[] where slug = 'ben-air-tootsie';
-- Ben Air Tootsie Rewind
update public.figures set aliases = '{"ben air tootsie rewind"}'::text[] where slug = 'ben-air-tootsie-rewind';
-- Egg Roll
update public.figures set aliases = '{"eggroll"}'::text[] where slug = 'egg-roll';
-- Bell Air Moby Dick
update public.figures set aliases = '{"bell air moby","bellair moby dick"}'::text[] where slug = 'bell-air-moby-dick';
-- Egg Mobe
update public.figures set aliases = '{"eggmobe"}'::text[] where slug = 'egg-mobe';
-- Tweetie 5
update public.figures set aliases = '{"tweetie cinq","tweetie five","tweetie 5","tweetie 540"}'::text[] where slug = 'tweetie-5';
-- Tweetie Dick
update public.figures set aliases = '{"tweetie dick"}'::text[] where slug = 'tweetie-dick';
-- Blind
update public.figures set aliases = '{"blind air"}'::text[] where slug = 'blind';
-- BS Shifty
update public.figures set aliases = '{"back shifty","shifty back"}'::text[] where slug = 'seated-bs-shifty';
-- FS Shifty
update public.figures set aliases = '{"shifty","front shifty"}'::text[] where slug = 'seated-fs-shifty';
-- Olé
update public.figures set aliases = '{"ola"}'::text[] where slug = 'ole';
-- Body Varial
update public.figures set aliases = '{"body varial","bodyvarial"}'::text[] where slug = 'ws-body-varial';
