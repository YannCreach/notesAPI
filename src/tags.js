const utilsModule = require('./utils');

const tagModule = {
  
  makeTagInDOM(tag) {
		const tagDOM = document.createElement('span');
		tagDOM.dataset.tagId = tag.id;
		tagDOM.textContent = tag.name;
		//tagDOM.style.backgroundColor = tag.color;
 
		// On lui donne la class Bulma
		tagDOM.classList.add('tag');

		const cardDOM = document.querySelector(`[data-card-id="${tag.cart_has_tag.cart_id}"]`);
		cardDOM.querySelector('.tags').appendChild(tagDOM);
  },

  async showTagModal(event) {

		const modal = document.querySelector('#addTagToCardModal');

		// Récupérer l'id de la carte sur laquelle le tag doit être associé
		const cardDOM = event.target.closest('.box');
		const cardId = cardDOM.dataset.cardId;

		// On insède l'id de la carte en valeur de l'input cachée
		modal.querySelector('input[name="card_id"]').value = cardId;

		const select = modal.querySelector('select[name="tag_id"]');
		select.textContent = '';

		try {
			
			const response = await fetch(`${utilsModule.base_url}/tag`);

			if (!response.ok) throw new Error(response.status);

			const tagsArray = await response.json();

			console.log(tagsArray);

			const tagsDOM = cardDOM.querySelectorAll('.tag');

			// si la carte possède déjà tous les tags, inutile d'aller plus loin : ferme la modal
			if (tagsDOM.length === tagsArray.length) return utilsModule.hideModals();

			// Pour chaque tag on va créer une balise option à insérer dans le select
			for (const tag of tagsArray) {

				// On crée la balise option
				const option = document.createElement('option');
				option.textContent = tag.name;
				option.value = tag.id;
				select.appendChild(option);
				
			}			

		} catch (error) {
			console.error(error);
			alert('Impossible de récupérer tous les tags !');
		}

		modal.classList.add('is-active');

	},

	async associateTagToCard(event) {
		event.preventDefault();

		const formData = new FormData(event.target);
    const formDataEntries = Object.fromEntries(formData);

		try {
			
			// Faire un appel API en POST sur /cards/:id/tags pour associer un tag à sa carte
			const response = await fetch(`${utilsModule.base_url}/cart/${formData.get('cart_id')}/tags`, {
				method: 'POST',
				headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formDataEntries.name,
        })
			});

			if (!response.ok) throw new Error(response.status);

			const json = await response.json();

			for (const tag of json.tags) {
				tagModule.makeTagInDOM(tag);
			}

		} catch (error) {
			console.error(error);	
		}

		utilsModule.hideModals();

	}


}

module.exports = tagModule;