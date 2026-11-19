-- Chez Elia : textes de présentation de départ des rayons (pages /rayons/<slug>), modifiables ensuite dans l'admin (onglet Catégories).
-- Rédigés uniquement à partir des produits réellement présents au catalogue le 2026-11-19 (aucun prix, aucune promesse invérifiable).
-- Rayon des alcools : contenu informatif seulement (loi Evin). La mention sanitaire et l'interdiction de vente aux mineurs
-- sont affichées automatiquement par la page (ALCOHOL_NOTICE) : elles ne sont pas répétées dans ce texte.
-- Idempotent : n'écrit que si le texte est encore vide ; un texte rédigé ou modifié par les propriétaires n'est jamais écrasé.

update public.categories set seo_intro = E'Bonbons, confiseries et snacks du monde entier, au 4 rue Sédillot à Strasbourg. Côté sucré : bonbons américains Airheads, Jelly Belly, Nerds Rope et Toxic Waste, popcorn Candy Pop, Peelerz, mochis Royal Family et Pocky japonais. Côté salé : Pringles en éditions spéciales, chips Brets, nachos et nouilles épicées Samyang Buldak.\nLa liste évolue au fil des arrivages : passez nous voir pour découvrir les nouveautés.'
where slug = 'confiserie' and seo_intro is null;

update public.categories set seo_intro = E'Boissons fraîches et introuvables ailleurs, au 4 rue Sédillot à Strasbourg. Sodas américains comme Dr Pepper et Calypso, éditions spéciales de Red Bull, Monster, bubble teas OMG, boissons Jane et B''lue, thés glacés, jus Granini et eaux d''Alsace Carola.\nIdéal pour une soirée ou un petit creux tard : la liste évolue au fil des arrivages.'
where slug = 'boissons' and seo_intro is null;

update public.categories set seo_intro = E'L''épicerie de dépannage du quotidien, au 4 rue Sédillot à Strasbourg : couscous, semoules et pâtes Samia, sucre d''Erstein, farine, bouillons, capsules Nescafé Dolce Gusto.\nEt des sauces du monde pour relever vos plats : Sriracha, Tabasco, harissa, wasabi, sauces soja Suzi Wan, pickles Yonca et Marshmallow Fluff.'
where slug = 'epicerie' and seo_intro is null;

update public.categories set seo_intro = E'Le rayon des alcools de Chez Elia, au 4 rue Sédillot à Strasbourg : bières, dont des bières d''Alsace comme Licorne, Météor et Kronenbourg, vins dont un Pinot Gris d''Alsace, champagnes et spiritueux (vodka, gin, rhum, tequila, whisky).'
where slug = 'alcools' and seo_intro is null;
