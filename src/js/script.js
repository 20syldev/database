import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Configuration visible mais autorise seulement les requêtes de mon domaine
const firebaseConfig = {
    apiKey: "AIzaSyADogsB2N9AhoIXl6lt2izekJt4UCuzeOc",
    authDomain: "database20syl.firebaseapp.com",
    databaseURL: "https://database20syl-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "database20syl",
    storageBucket: "database20syl.appspot.com",
    messagingSenderId: "825065499933",
    appId: "1:825065499933:web:7479f3ad29f32e8b9cc5f4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fonction pour rechercher un nom d'utilisateur dans Firebase
function searchUsername(username, target) {
    get(ref(db, 'identifiants/username/' + username)).then(snapshot => {
        if (snapshot.exists()) {
            const occurrences = snapshot.val().occurrences;
            const sum = snapshot.val().sum.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;");
            const moyenne = (snapshot.val().sum / snapshot.val().occurrences).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "&nbsp;");
            if (occurrences > 1) {
                document.getElementById(target).innerHTML = `Apparitions : ${occurrences} fois<br>Montant total : ${sum}€<br>Moyenne des montants : ${moyenne}€`; // Mettre à jour si apparition > 1
            } 
            else {
                document.getElementById(target).innerHTML = `Apparition : ${occurrences} fois<br>Montant total : ${sum}€<br>Moyenne des montants : ${moyenne}€`; // Mettre à jour si apparition = 1
            }
        }
    });
}

// Fonction pour récupérer les noms d'utilisateur existants dans Firebase
function getExistingUsernames() {
    return get(ref(db, 'identifiants/username')).then(snapshot => {
        const usernames = [];
        snapshot.forEach(childSnapshot => {
            usernames.push(childSnapshot.key);
        });
        return usernames;
    });
}

// Fonction pour mettre à jour la liste de suggestions
function updateSuggestions(suggestions, suggestionsListId, targetInputId, targetOccurrencesId) {
    const suggestionsList = document.getElementById(suggestionsListId);
    suggestionsList.innerHTML = ''; // Effacer les suggestions précédentes
    const inputUsername = document.getElementById(targetInputId).value.trim(); // Obtenir le nom d'utilisateur d'entrée sans espaces

    suggestions.forEach(username => {
        // Comparer les noms d'utilisateur sans tenir compte de la casse
        if (username.toLowerCase() === inputUsername.toLowerCase()) {
            const listItem = document.createElement('li');
            listItem.textContent = username;
            listItem.classList.add('list-group-item', 'list-group-item-action', 'suggestion-item', 'active'); // Ajouter la classe active pour correspondre au nom d'utilisateur d'entrée
            listItem.addEventListener('click', () => {
                document.getElementById(targetInputId).value = username;
                suggestionsList.innerHTML = ''; // Effacer les suggestions après la sélection
                searchUsername(username, targetOccurrencesId); // Mettre à jour le nombre d'occurrences après la sélection
            });
            suggestionsList.appendChild(listItem);
        } 
        else {
            const listItem = document.createElement('li');
            listItem.textContent = username;
            listItem.classList.add('list-group-item', 'list-group-item-action', 'suggestion-item');
            listItem.addEventListener('click', () => {
                document.getElementById(targetInputId).value = username;
                suggestionsList.innerHTML = ''; // Effacer les suggestions après la sélection
                searchUsername(username, targetOccurrencesId); // Mettre à jour le nombre d'occurrences après la sélection
            });
            suggestionsList.appendChild(listItem);
        }
    });
}

// Fonction pour sauvegarder le nom d'utilisateur dans Firebase
function saveUsername(username, sum) {
    const button = document.getElementById('submit-btn');
    const inputField = document.getElementById('username');
    button.disabled = true; // Désactiver le bouton pendant le traitement
    inputField.disabled = true; // Désactiver le champ de saisie pendant le traitement

    // Vérifier si la somme est un nombre valide et supérieur ou égal à 0
    if (isNaN(parseFloat(sum.replace(',', '.'))) || parseFloat(sum.replace(',', '.')) < 0) {
        button.disabled = false; // Réactiver le bouton
        inputField.disabled = false; // Réactiver le champ de saisie
        return; // Sortir de la fonction prématurément
    }

    button.innerText = 'Envoyé !'; // Changer le texte du bouton en 'Envoyé !'
    button.classList.remove('btn-primary');
    button.classList.add('btn-success'); // Changer la couleur du bouton en vert
    document.getElementById('cancel-btn').style.display = 'inline-block'; // Afficher le bouton d'annulation

    // Récupérer le nombre d'occurrences actuel et la somme existante de manière asynchrone
    get(ref(db, 'identifiants/username/' + username)).then(snapshot => {
        const currentOccurrences = snapshot.exists() ? snapshot.val().occurrences : 0;
        const existingSum = snapshot.exists() ? snapshot.val().sum || 0 : 0;
        const updatedOccurrences = currentOccurrences + 1;
        const newSum = existingSum + parseFloat(sum.replace(',', '.')); // Ajouter la nouvelle somme à la somme existante
        // Sauvegarder le nombre d'occurrences et la somme mise à jour dans la base de données
        set(ref(db, 'identifiants/username/' + username), {
            occurrences: updatedOccurrences,
            sum: newSum
        }).then(() => {
            clearTimeout(cancelTimeout); // Effacer le délai d'annulation
            setTimeout(() => { // Réinitialiser l'état du bouton après 3 secondes
                button.innerText = 'Envoyer';
                button.classList.remove('btn-success');
                button.classList.add('btn-primary');
                inputField.value = ''; // Effacer le champ de saisie
                document.getElementById('sum').value = ''; // Effacer le champ de saisie de la somme
                inputField.disabled = false; // Réactiver le champ de saisie
            }, 2000);
            cancelTimeout = setTimeout(() => { // Réinitialiser l'état du bouton d'annulation après 5 secondes
                document.getElementById('cancel-btn').style.display = 'none'; // Masquer le bouton d'annulation
            }, 5000);
        }).catch(() => {
            button.innerText = 'Erreur !'; // Changer le texte du bouton en 'Erreur !' en cas d'erreur
            button.classList.remove('btn-primary');
            button.classList.add('btn-danger'); // Changer la couleur du bouton en rouge
            setTimeout(() => { // Réinitialiser l'état du bouton après 3 secondes
                button.innerText = 'Envoyer';
                button.classList.remove('btn-danger');
                button.classList.add('btn-primary');
                inputField.value = ''; // Effacer le champ de saisie
                document.getElementById('sum').value = ''; // Effacer le champ de saisie de la somme
                inputField.disabled = false; // Réactiver le champ de saisie
                document.getElementById('cancel-btn').style.display = 'none'; // Masquer le bouton d'annulation
            }, 3000);
            // Supprimer le nom d'utilisateur de la base de données en cas d'erreur
            remove(ref(db, 'identifiants/username/' + username));
        });
    });
}

let cancelTimeout; // Déclarer une variable pour stocker le délai d'annulation

// Événements pour la soumission du formulaire
document.getElementById('username-form').addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const sum = document.getElementById('sum').value;
    const button = document.getElementById('submit-btn');
    const inputField = document.getElementById('username');

    // Vérifier si la somme est un nombre valide et supérieur ou égal à 0
    if (isNaN(parseFloat(sum.replace(',', '.'))) || parseFloat(sum.replace(',', '.')) < 0) {
        // Afficher un message d'erreur
        alert('Veuillez entrer une somme valide et positive.');
        return; // Sortir de la fonction prématurément
    }

    saveUsername(username, sum);
    searchUsername(username, 'occurrences-count'); // Mettre à jour le nombre d'occurrences immédiatement après la soumission
});

// Événements pour le bouton d'annulation
document.getElementById('cancel-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const sum = parseFloat(document.getElementById('sum').value.replace(',', '.'));
    get(ref(db, 'identifiants/username/' + username)).then(snapshot => {
        const currentOccurrences = snapshot.exists() ? snapshot.val().occurrences : 0;
        const existingSum = snapshot.exists() ? snapshot.val().sum || 0 : 0;
        const updatedOccurrences = currentOccurrences - 1;
        const newSum = existingSum - sum; // Déduire la somme annulée de la somme existante
        if (updatedOccurrences > 0) {
            set(ref(db, 'identifiants/username/' + username), {
                occurrences: updatedOccurrences,
                sum: newSum >= 0 ? newSum : 0 // S'assurer que la somme n'est pas négative
            }).catch((error) => {
                console.error("Erreur lors du décrément d'occurrence : ", error);
            });
        } 
        else {
            remove(ref(db, 'identifiants/username/' + username)).catch((error) => {
                console.error("Erreur lors de la suppression du nom d'utilisateur de la base de données : ", error);
            });
        }
        document.getElementById('submit-btn').innerText = 'Envoyer';
        document.getElementById('submit-btn').classList.remove('btn-danger');
        document.getElementById('submit-btn').classList.add('btn-primary');
        document.getElementById('cancel-btn').style.display = 'none';
        document.getElementById('username').value = ''; // Effacer le champ de saisie
        document.getElementById('sum').value = ''; // Effacer le champ de saisie de la somme
    }).catch((error) => {
        console.error("Erreur lors de l'obtention du nombre d'occurrences : ", error);
    });
});

// Événements pour le champ de saisie afin d'activer/désactiver le bouton d'envoi
document.getElementById('username').addEventListener('input', e => {
    const button = document.getElementById('submit-btn');
    const sumInput = document.getElementById('sum').value.trim();
    const usernameInput = e.target.value.trim();
    const sum = parseFloat(sumInput.replace(',', '.'));

    // Vérifier si la somme n'est pas un nombre ou si elle est négative
    if (isNaN(sum) || sum < 0) {
        button.disabled = true; // Désactiver le bouton si la somme n'est pas un nombre valide positif
    } 
    else {
        button.disabled = !usernameInput || !sumInput; // Désactiver le bouton si la valeur de l'entrée est vide
    }

    const input = e.target.value.trim().toLowerCase();
    if (input) { // Vérifier si la valeur de l'entrée n'est pas vide
        getExistingUsernames().then(usernames => {
            const filteredUsernames = usernames.filter(username => username.toLowerCase().startsWith(input));
            updateSuggestions(filteredUsernames, 'input-suggestions-list', 'username', 'occurrences-count');
        });
    } else {
        document.getElementById('input-suggestions-list').innerHTML = ''; // Effacer les suggestions si l'entrée est vide
    }
});

// Événements pour le champ de saisie afin d'activer/désactiver le bouton d'envoi
document.getElementById('sum').addEventListener('input', e => {
    const button = document.getElementById('submit-btn');
    const usernameInput = document.getElementById('username').value.trim();
    const sumInput = e.target.value.trim();
    const sum = parseFloat(sumInput.replace(',', '.'));

    // Vérifier si la somme n'est pas un nombre ou si elle est négative
    if (isNaN(sum) || sum < 0) {
        button.disabled = true; // Désactiver le bouton si la somme n'est pas un nombre valide positif
    } 
    else {
        button.disabled = !usernameInput || !sumInput; // Désactiver le bouton si la valeur de l'entrée est vide
    }
});

// Événements pour la saisie de recherche
document.getElementById('search-username').addEventListener('input', e => {
    const input = e.target.value.trim().toLowerCase();
    if (input) { // Vérifier si la valeur de l'entrée n'est pas vide
        getExistingUsernames().then(usernames => {
            const filteredUsernames = usernames.filter(username => username.toLowerCase().startsWith(input));
            updateSuggestions(filteredUsernames, 'search-suggestions-list', 'search-username', 'search-occurrences-count');
        });
        document.getElementById('search-occurrences-count').innerText = ''; // Effacer le texte par défaut
    } 
    else {
        document.getElementById('search-suggestions-list').innerHTML = ''; // Effacer les suggestions si l'entrée est vide
        document.getElementById('search-occurrences-count').innerText = 'Recherchez un nom d\'utilisateur pour afficher les informations.'; // Réinitialiser le texte par défaut
    }
});