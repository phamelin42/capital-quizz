import { Place } from './place';

/** Les 50 états des États-Unis. Washington D.C. n’est pas un état : il est la capitale du pays dans le mode monde. */
export const US_STATE_LIST: readonly Place[] = [
  {
    code: 'al',
    capital: 'Montgomery',
    landmark: 'Capitole de l’État d’Alabama',
    funFact:
      'En décembre 1955, Rosa Parks y a refusé de céder sa place dans un bus : ce geste a déclenché le boycott des bus de Montgomery.',
  },
  {
    code: 'ak',
    capital: 'Juneau',
    landmark: 'Glacier Mendenhall',
    funFact:
      'Aucune route ne la relie au reste de l’état ni au reste du pays : on y accède uniquement par avion ou par bateau.',
  },
  {
    code: 'az',
    capital: 'Phoenix',
    landmark: 'Camelback Mountain',
    funFact:
      'Son nom évoque l’oiseau qui renaît de ses cendres : la ville a été bâtie près de canaux creusés des siècles plus tôt par le peuple hohokam.',
  },
  {
    code: 'ar',
    capital: 'Little Rock',
    landmark: 'Little Rock Central High School',
    funFact:
      'En 1957, neuf lycéens noirs, les « Little Rock Nine », ont intégré le lycée Central High School sous la protection de l’armée.',
  },
  {
    code: 'ca',
    capital: 'Sacramento',
    landmark: 'Capitole de l’État de Californie',
    funFact:
      'Ce n’est ni Los Angeles ni San Francisco. La ville a grandi avec la ruée vers l’or de 1848-1849, partie d’un moulin des environs.',
  },
  {
    code: 'co',
    capital: 'Denver',
    landmark: 'Capitole de l’État du Colorado',
    funFact:
      'Surnommée « la ville d’un mile de haut », elle est à 1 609 mètres d’altitude. Une marche du Capitole indique l’altitude exacte d’un mile.',
  },
  {
    code: 'ct',
    capital: 'Hartford',
    landmark: 'Maison de Mark Twain',
    funFact:
      'On l’appelle « la ville des assurances », car de nombreuses compagnies y ont leur siège. Mark Twain y a vécu et y a écrit certains de ses livres.',
  },
  {
    code: 'de',
    capital: 'Dover',
    landmark: 'Legislative Hall',
    funFact:
      'Le Delaware a été le premier état à ratifier la Constitution, le 7 décembre 1787, d’où son surnom de « Premier État ».',
  },
  {
    code: 'fl',
    capital: 'Tallahassee',
    landmark: 'Capitole de l’État de Floride',
    funFact:
      'Elle a été choisie en 1824 parce qu’elle se trouve à mi-chemin entre Saint Augustine et Pensacola, les deux plus anciennes villes de l’état.',
  },
  {
    code: 'ga',
    capital: 'Atlanta',
    landmark: 'Centennial Olympic Park',
    funFact:
      'Le Coca-Cola y a été inventé en 1886 par le pharmacien John Pemberton. La ville a accueilli les Jeux olympiques d’été de 1996.',
  },
  {
    code: 'hi',
    capital: 'Honolulu',
    landmark: 'Palais ʻIolani',
    funFact:
      'Le palais ʻIolani est le seul palais royal des États-Unis. Il a été habité par les derniers monarques d’Hawaï.',
  },
  {
    code: 'id',
    capital: 'Boise',
    landmark: 'Capitole de l’État de l’Idaho',
    funFact:
      'Son nom viendrait du français « boisé » : selon la tradition, des trappeurs francophones auraient été frappés par les arbres qui bordent la rivière dans un paysage aride.',
  },
  {
    code: 'il',
    capital: 'Springfield',
    landmark: 'Maison de Lincoln',
    funFact:
      'Abraham Lincoln y a vécu de 1837 à 1861, avant de partir pour la Maison-Blanche. Sa maison se visite toujours.',
  },
  {
    code: 'in',
    capital: 'Indianapolis',
    landmark: 'Indianapolis Motor Speedway',
    funFact:
      'Les 500 Miles d’Indianapolis, une course automobile très célèbre, s’y courent chaque année depuis 1911.',
  },
  {
    code: 'ia',
    capital: 'Des Moines',
    landmark: 'Capitole de l’État de l’Iowa',
    funFact:
      'Son nom vient du français « rivière des Moines ». Le Capitole est surmonté d’un grand dôme doré.',
  },
  {
    code: 'ks',
    capital: 'Topeka',
    landmark: 'Capitole de l’État du Kansas',
    funFact:
      'La décision « Brown contre le Conseil de l’éducation », qui a mis fin à la ségrégation dans les écoles publiques en 1954, vient d’une affaire née à Topeka.',
  },
  {
    code: 'ky',
    capital: 'Frankfort',
    landmark: 'Capitole de l’État du Kentucky',
    funFact:
      'Avec environ 28 000 habitants, c’est l’une des plus petites capitales d’état des États-Unis. Elle s’étend le long de la rivière Kentucky.',
  },
  {
    code: 'la',
    capital: 'Bâton-Rouge',
    landmark: 'Capitole de l’État de Louisiane',
    funFact:
      'Son nom français vient d’un poteau rouge qui marquait la limite entre deux territoires indiens. Son Capitole est le plus haut des États-Unis.',
  },
  {
    code: 'me',
    capital: 'Augusta',
    landmark: 'Maine State House',
    funFact:
      'La capitale a quitté Portland pour Augusta en 1832, sur la rivière Kennebec, plus à l’intérieur des terres.',
  },
  {
    code: 'md',
    capital: 'Annapolis',
    landmark: 'Maryland State House',
    funFact:
      'En 1783 et 1784, elle a été la capitale du pays. Le Congrès y a ratifié le traité de Paris, qui a mis fin à la guerre d’Indépendance.',
  },
  {
    code: 'ma',
    capital: 'Boston',
    landmark: 'Faneuil Hall',
    funFact:
      'C’est à Boston, en décembre 1773, que des colons ont jeté du thé à la mer lors de la « Boston Tea Party », un épisode qui a précédé la guerre d’Indépendance.',
  },
  {
    code: 'mi',
    capital: 'Lansing',
    landmark: 'Capitole de l’État du Michigan',
    funFact:
      'Ce n’est ni Detroit ni Grand Rapids. Lansing, alors un village perdu dans la forêt, a été choisie comme capitale en 1847.',
  },
  {
    code: 'mn',
    capital: 'Saint Paul',
    landmark: 'Cathédrale de Saint Paul',
    funFact:
      'Elle forme avec Minneapolis les « villes jumelles » (Twin Cities), séparées par le fleuve Mississippi.',
  },
  {
    code: 'ms',
    capital: 'Jackson',
    landmark: 'Capitole de l’État du Mississippi',
    funFact:
      'Elle porte le nom d’Andrew Jackson, général devenu président des États-Unis, et elle est la plus grande ville de l’état.',
  },
  {
    code: 'mo',
    capital: 'Jefferson City',
    landmark: 'Capitole du Missouri',
    funFact:
      'Elle porte le nom du président Thomas Jefferson. Ce n’est ni Saint-Louis ni Kansas City, les deux plus grandes villes de l’état.',
  },
  {
    code: 'mt',
    capital: 'Helena',
    landmark: 'Cathédrale Sainte-Hélène de Helena',
    funFact:
      'Elle est née en 1864 de la découverte d’or à Last Chance Gulch : en quelques années, des chercheurs d’or y ont fait fortune.',
  },
  {
    code: 'ne',
    capital: 'Lincoln',
    landmark: 'Capitole de l’État du Nebraska',
    funFact:
      'Elle s’appelait Lancaster avant d’être rebaptisée Lincoln, en l’honneur du président assassiné. Son Capitole, haut d’environ 122 mètres, est une tour.',
  },
  {
    code: 'nv',
    capital: 'Carson City',
    landmark: 'Capitole de l’État du Nevada',
    funFact:
      'Elle porte le nom de Kit Carson, un explorateur. Ce n’est ni Las Vegas ni Reno, bien plus grandes.',
  },
  {
    code: 'nh',
    capital: 'Concord',
    landmark: 'New Hampshire State House',
    funFact:
      'Son State House, bâti en 1819, est le plus ancien des États-Unis dont les assemblées siègent encore dans leurs salles d’origine.',
  },
  {
    code: 'nj',
    capital: 'Trenton',
    landmark: 'New Jersey State House',
    funFact:
      'Le soir de Noël 1776, George Washington a traversé le fleuve Delaware pour y attaquer des troupes allemandes au service des Britanniques : la bataille de Trenton a relancé la guerre d’Indépendance.',
  },
  {
    code: 'nm',
    capital: 'Santa Fe',
    landmark: 'Palais des gouverneurs de Santa Fe',
    funFact:
      'Fondée en 1610, c’est la plus ancienne capitale d’état des États-Unis. À environ 2 200 mètres, c’est aussi la plus haute.',
  },
  {
    code: 'ny',
    capital: 'Albany',
    landmark: 'Capitole de l’État de New York',
    funFact:
      'Ce n’est pas New York. Fondée par des Néerlandais au début du XVIIe siècle sur l’Hudson, Albany est l’une des plus anciennes villes du pays.',
  },
  {
    code: 'nc',
    capital: 'Raleigh',
    landmark: 'Capitole de l’État de Caroline du Nord',
    funFact:
      'Elle porte le nom de sir Walter Raleigh, qui avait financé les premières tentatives de colonisation anglaise en Amérique du Nord.',
  },
  {
    code: 'nd',
    capital: 'Bismarck',
    landmark: 'Capitole de l’État du Dakota du Nord',
    funFact:
      'Elle porte le nom du chancelier allemand Otto von Bismarck : on espérait ainsi attirer des investisseurs et des colons allemands.',
  },
  {
    code: 'oh',
    capital: 'Columbus',
    landmark: 'Ohio Statehouse',
    funFact:
      'Elle porte le nom de Christophe Colomb. C’est aujourd’hui la plus grande ville de l’Ohio.',
  },
  {
    code: 'ok',
    capital: 'Oklahoma City',
    landmark: 'Capitole de l’État d’Oklahoma',
    funFact:
      'Le 22 avril 1889, des dizaines de milliers de colons se sont rués sur ces terres au coup de feu de départ : la ville est née en une journée. Des puits de pétrole ont même été forés sur la pelouse du Capitole.',
  },
  {
    code: 'or',
    capital: 'Salem',
    landmark: 'Capitole de l’État de l’Oregon',
    funFact:
      'Son nom viendrait de l’hébreu « shalom », la paix. Une statue dorée de pionnier surmonte le Capitole.',
  },
  {
    code: 'pa',
    capital: 'Harrisburg',
    landmark: 'Capitole de l’État de Pennsylvanie',
    funFact:
      'Ce n’est pas Philadelphie. Capitale depuis 1812, Harrisburg abrite un Capitole inauguré en 1906 que l’on a surnommé « le palais de l’art ».',
  },
  {
    code: 'ri',
    capital: 'Providence',
    landmark: 'Capitole de l’État de Rhode Island',
    funFact:
      'Elle a été fondée en 1636 par Roger Williams, qui fuyait l’intolérance religieuse du Massachusetts voisin.',
  },
  {
    code: 'sc',
    capital: 'Columbia',
    landmark: 'Capitole de l’État de Caroline du Sud',
    funFact:
      'Elle a été créée en 1786 pour que la capitale se trouve au centre de l’état, et non sur la côte comme Charleston.',
  },
  {
    code: 'sd',
    capital: 'Pierre',
    landmark: 'Capitole de l’État du Dakota du Sud',
    funFact:
      'Son nom français se prononce comme l’anglais « peer ». C’est l’une des plus petites capitales d’état des États-Unis.',
  },
  {
    code: 'tn',
    capital: 'Nashville',
    landmark: 'Grand Ole Opry',
    funFact:
      'On l’appelle « Music City » : c’est la capitale de la musique country. Le Grand Ole Opry y diffuse un concert à la radio depuis 1925.',
  },
  {
    code: 'tx',
    capital: 'Austin',
    landmark: 'Capitole de l’État du Texas',
    funFact:
      'Le Capitole, achevé en 1888, est plus haut que celui de Washington. Sous le pont de l’avenue Congress, des centaines de milliers de chauves-souris s’envolent chaque soir d’été.',
  },
  {
    code: 'ut',
    capital: 'Salt Lake City',
    landmark: 'Temple de Salt Lake City',
    funFact:
      'Des pionniers mormons l’ont fondée en 1847, près du Grand Lac Salé. Le temple, dont la construction a commencé en 1853, n’a été terminé qu’en 1893.',
  },
  {
    code: 'vt',
    capital: 'Montpelier',
    landmark: 'Capitole de l’État du Vermont',
    funFact:
      'Avec environ 8 000 habitants, c’est la plus petite capitale d’état des États-Unis. Son nom vient de la ville française de Montpellier.',
  },
  {
    code: 'va',
    capital: 'Richmond',
    landmark: 'Capitole de l’État de Virginie',
    funFact:
      'Elle a été la capitale des États confédérés pendant la guerre de Sécession. Son Capitole a été dessiné par Thomas Jefferson.',
  },
  {
    code: 'wa',
    capital: 'Olympia',
    landmark: 'Capitole de l’État de Washington',
    funFact:
      'Ce n’est pas Seattle. Olympia doit son nom aux monts Olympiques, que l’on voit depuis la ville.',
  },
  {
    code: 'wv',
    capital: 'Charleston',
    landmark: 'Capitole de l’État de Virginie-Occidentale',
    funFact:
      'Le dôme doré du Capitole, haut d’environ 89 mètres, dépasse celui du Capitole de Washington.',
  },
  {
    code: 'wi',
    capital: 'Madison',
    landmark: 'Capitole de l’État du Wisconsin',
    funFact:
      'Elle est bâtie sur un isthme entre deux lacs, Mendota et Monona. Le dôme du Capitole est en granit, ce qui est rare pour un capitole d’état.',
  },
  {
    code: 'wy',
    capital: 'Cheyenne',
    landmark: 'Capitole de l’État du Wyoming',
    funFact:
      'Chaque été depuis 1897, la ville accueille les Cheyenne Frontier Days, l’un des plus grands rodéos du monde.',
  },
];
