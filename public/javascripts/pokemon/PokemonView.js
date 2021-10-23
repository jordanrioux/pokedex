import { qs, qsa } from "../dom/selector.js";
import { $delegate, $on, $one } from "../dom/event-handlers.js";
import JsonFetcher from "../fetchers/JsonFetcher.js";
import PokemonTemplate from "./PokemonTemplate.js";
import { removeItemAll } from "../helpers/array.js";

const FETCH_TYPES_URL = "https://presentation.codewithjordy.com/web-iii/samples/types.json";
const FETCH_POKEMONS_URL = "https://presentation.codewithjordy.com/web-iii/samples/pokedex.json";

const FILTER_ALL = "all";
const FILTER_SELECTED_DATA_KEY = "data-selected";

const SELECTOR_POKEMON = "[data-pokemon]";

const CLASS_NAME_SELECTED = "is-selected";
const CLASS_NAME_HIDDEN = "is-hidden";

export default class PokemonView {
    constructor() {        
        this.fetcher = new JsonFetcher();
        this.template = new PokemonTemplate();
        this.currentlySelectedTypes = [ FILTER_ALL ];
        this.$pokemonContainer = qs(".pokemon-container");
        this.$pokemonFilter = qs("[data-pokemon-filter]");
        
        this.renderPokemonList();
        this.registerEventHandlers();
    }

    renderPokemonList() {
        this.fetcher.get(FETCH_TYPES_URL).then(this._renderPokemonFilter.bind(this));
        this.fetcher.get(FETCH_POKEMONS_URL).then(this._renderPokemonList.bind(this));
    }

    _renderPokemonFilter(types) {   
        this.$pokemonFilter.innerHTML = this.template.pokemonFilter(types);
    }
    
    _renderPokemonList(pokemons) {    
        this.$pokemonContainer.innerHTML = this.template.pokemonList(pokemons);
    }

    registerEventHandlers() {
        $delegate(this.$pokemonFilter, "click", "button", (e) => {
            const selectedFilter = e.target;
            const selectedType = selectedFilter.dataset.pokemonType;            
            this._toggleFilterButtonState(selectedFilter, selectedType);
            this._toggleFilterAllButtonState(selectedType);
            this._filterAllPokemons();
        });


        // Dispatch l'événement custom "modal.shown"
        $delegate(this.$pokemonContainer, "click", SELECTOR_POKEMON, (e) => {
            const parent = e.target.closest("[data-pokemon-id]");
            const modal = qs("[data-pokemon-modal]");    
            const modalShownEvent = new CustomEvent("modal.shown", {
                detail: {
                    pokemonId: parent.dataset.pokemonId
                }
            });
            modal.dispatchEvent(modalShownEvent);
        });

        // TODO: Besoin de refactoring pour le modal! Utiliser data-attributs, rendre générique, etc.

        // Voir: https://developer.mozilla.org/en-US/docs/Web/Events/Creating_and_triggering_events
        // Définir l'événement custom "modal.shown"
        $on("[data-pokemon-modal]", "modal.shown", (e) => {
            const modal = e.target;
            const dialog = qs(".pokemon-modal-dialog", modal);
            const pokemonId = e.detail.pokemonId;
        
            const shadow = qs(".pokemon-modal-shadow");
            this.fetcher.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
                .then((pokemon) => {
                    dialog.innerHTML = this.template.pokemonDetails(pokemon);
                    modal.classList.add("show");
                    shadow.classList.add("show");
                });
                
            $one(shadow, "click", (e) => {
                modal.classList.remove("show");
                shadow.classList.remove("show");
            });
        });
    }

    _toggleFilterButtonState(filter, selectedValue) {
        if (filter.hasAttribute(FILTER_SELECTED_DATA_KEY)) {
            this._unselectFilterButton(filter, selectedValue);
        } else {
            this._selectFilterButton(filter, selectedValue);            
        }
    }

    _toggleFilterAllButtonState(selectedValue) {
        const allButton = qs(`[data-pokemon-type="${FILTER_ALL}"]`);
        if (selectedValue === FILTER_ALL) {
            this._unselectAllFilterButtons();
        } else if (this.currentlySelectedTypes.length > 1) {
            this._unselectFilterButton(allButton, FILTER_ALL);
        } else if (this.currentlySelectedTypes.length === 0) {
            this._selectFilterButton(allButton, FILTER_ALL);
        }
    }

    _selectFilterButton(filter, selectedValue) {
        filter.setAttribute(FILTER_SELECTED_DATA_KEY, "");
        filter.classList.add(CLASS_NAME_SELECTED);
        this.currentlySelectedTypes.push(selectedValue);
    }

    _unselectFilterButton(filter, selectedValue) {
        filter.removeAttribute(FILTER_SELECTED_DATA_KEY);
        filter.classList.remove(CLASS_NAME_SELECTED);
        removeItemAll(this.currentlySelectedTypes, selectedValue);
    }

    _unselectAllFilterButtons() { 
        const buttons = qsa(`[data-pokemon-type]:not([data-pokemon-type="${FILTER_ALL}"])`);
        for (const button of buttons) {
            this._unselectFilterButton(button, button.dataset.pokemonType);
        }
    }

    _filterAllPokemons() {
        const pokemons = qsa(SELECTOR_POKEMON, this.$pokemonContainer);
        for (const pokemon of pokemons) {
            this._togglePokemonVisibility(pokemon);
        }
    }

    _togglePokemonVisibility(pokemon) {
        if (this._shouldPokemonBeVisible(pokemon)) {
            pokemon.classList.remove(CLASS_NAME_HIDDEN);
        } else {
            pokemon.classList.add(CLASS_NAME_HIDDEN);
        }
    }
    
    _shouldPokemonBeVisible(pokemon) {
        if (this.currentlySelectedTypes.includes(FILTER_ALL)) {
            return true;
        }
        const types = pokemon.dataset.pokemonTypes.split(",");
        return types.some(type => this.currentlySelectedTypes.includes(type.toLowerCase()));
    }
}