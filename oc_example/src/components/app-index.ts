import { startApp } from '@open-cells/core';
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ElementController } from '@open-cells/element-controller';
import { routes } from '../router/routes.js';
import { styles } from './app-index.css.js';
import '@material/web/icon/icon.js';
import '@material/web/iconbutton/outlined-icon-button.js';
import '@open-cells/page-transitions/page-transition-head-styles.js';
import { appConfig } from '../config/app.config.js';

startApp({
  routes,
  mainNode: 'app-content',
  viewLimit: 2,
  persistentPages: ['recipe'],
  appConfig,
  commonPages: ['category', 'recipe']
});

@customElement('app-index')
export class AppIndex extends LitElement {
  elementController = new ElementController(this);

  private _header: HTMLElement | undefined | null = null;
  private _root: HTMLElement | null = null;
  
  static styles = styles;

  @state()
  protected _likedRecipes = this._getLocalStorage();
  
  @state()
  protected _dislikedRecipes = this._getLocalStorageHateRecipies();

  

  connectedCallback() {
    super.connectedCallback();

    this.elementController.subscribe('scroll', (data: HTMLElement) => this._headerTransition(data));

    this.elementController.publish('liked-recipes', this._likedRecipes);
    this.elementController.subscribe('liked-recipes', (data: Set<Object>) => {
      this._setLocalStorage(data);
    });
    this.elementController.publish('disliked-recipes', this._dislikedRecipes);
    this.elementController.subscribe('disliked-recipes', (data: Set<Object>) => {
      this._setLocalStorageHateRecipies(data);
    });
  }

  firstUpdated(props: any) {
    super.firstUpdated(props);

    this._header = this.shadowRoot?.querySelector('header') as HTMLElement;
    this._root = document.querySelector(':root') as HTMLElement;
  }

  render() {
    return html`
      ${this._headerTpl}

      <main role="main" tabindex="-1">
        <slot></slot>
      </main>
    `;
  }

  get _headerTpl() {
    return html`
      <header>
        <div class="header-content">
          <div class="header-logo">
            <md-icon>skillet</md-icon>
            <h1><a href="#!/">Cells Recipes</a></h1>
          </div>
          <md-outlined-icon-button
            class="dark-mode"
            aria-label="Dark Mode"
            data-mode="light"
            toggle
            @click=${() => this._toogleDarkMode()}
          >
            <md-icon>dark_mode</md-icon>
            <md-icon slot="selected">light_mode</md-icon>
          </md-outlined-icon-button>
        </div>
      </header>
    `;
  }

  _headerTransition(data: HTMLElement) {
    if (data.scrollTop > 0) {
      this._header?.classList.add('scrolled');
    } else {
      this._header?.classList.remove('scrolled');
    }
  }

  _toogleDarkMode() {
    this._root?.hasAttribute('color-scheme-dark')
      ? this._root?.removeAttribute('color-scheme-dark')
      : this._root?.setAttribute('color-scheme-dark', 'true');
  }

  _setLocalStorage(setItem: Set<Object>) {
    // Eliminar items de disliked que estén en liked
    const updatedDisliked = this._removeConflictingItems(this._dislikedRecipes, setItem);
    if (updatedDisliked.size !== this._dislikedRecipes.size) {
      this._dislikedRecipes = updatedDisliked;
      this.elementController.publish('disliked-recipes', this._dislikedRecipes);
      this._saveToLocalStorage('_dislikedRecipes', this._dislikedRecipes);
    }

    const arrayFromSet = Array.from(setItem);
    const jsonData = JSON.stringify(arrayFromSet);
    localStorage.setItem('_likedRecipes', jsonData);
  }
 
  _setLocalStorageHateRecipies(setItem: Set<Object>) {
    // Eliminar items de liked que estén en disliked
    const updatedLiked = this._removeConflictingItems(this._likedRecipes, setItem);
    if (updatedLiked.size !== this._likedRecipes.size) {
      this._likedRecipes = updatedLiked;
      this.elementController.publish('liked-recipes', this._likedRecipes);
      this._saveToLocalStorage('_likedRecipes', this._likedRecipes);
    }

    const arrayFromSet = Array.from(setItem);
    const jsonData = JSON.stringify(arrayFromSet);
    localStorage.setItem('_dislikedRecipes', jsonData);
  }

  _getLocalStorage() {
    const jsonData = localStorage.getItem('_likedRecipes');
    return jsonData ? new Set(JSON.parse(jsonData)) : new Set();
  }
  
  _getLocalStorageHateRecipies() {
    const jsonData = localStorage.getItem('_dislikedRecipes');
    return jsonData ? new Set(JSON.parse(jsonData)) : new Set();
  }

  /**
   * Elimina de sourceSet los elementos que tienen el mismo idMeal que los elementos en conflictSet
   */
  _removeConflictingItems(sourceSet: Set<any>, conflictSet: Set<any>): Set<any> {
    const result = new Set<any>();
    const conflictIds = new Set<string>();
    
    // Extraer los IDs de las recetas en conflicto
    for (const item of conflictSet) {
      const recipe = item as any;
      if (recipe.idMeal) {
        conflictIds.add(recipe.idMeal);
      }
    }
    
    // Agregar solo los elementos que no están en conflicto
    for (const item of sourceSet) {
      const recipe = item as any;
      if (!recipe.idMeal || !conflictIds.has(recipe.idMeal)) {
        result.add(item);
      }
    }
    
    return result;
  }

  /**
   * Guarda un Set en localStorage con la clave especificada
   */
  _saveToLocalStorage(key: string, setItem: Set<any>) {
    const arrayFromSet = Array.from(setItem);
    const jsonData = JSON.stringify(arrayFromSet);
    localStorage.setItem(key, jsonData);
  }
}
