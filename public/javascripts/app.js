import PokemonView from "./pokemon/PokemonView.js";

// Toute la logique de la "view" (page) est dans la classe PokemonView
// On aurait également séparé en sous partie comme PokemonFilterView et PokemonListView (ou "fragment").
// On peut également aller un niveau plus loin en introduisant un PokemonController.
// Le Controller utiliserait la View pour assigner les événements et la logique, alors que la View gèrerait les élements de la page.
const view = new PokemonView();