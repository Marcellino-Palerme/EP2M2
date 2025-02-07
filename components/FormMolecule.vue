<!--
© 2024 INRAE
SPDX-FileContributor: Marcellino Palerme <marcellino.palerme@inrae.fr>

SPDX-License-Identifier: MIT

The file profile form molecule composant
-->
<script setup lang="ts">
import { log } from 'node:console';
import type { tMolecule } from '~/server/api/molecule/functions';

const { t } = useI18n();

const props = defineProps({
  // id of molecule
  idMolecule: {
    type: String,
    default: '',
    required: false
  },
  // view mode of dialog box
  action: {
    type: String,
    default: 'add',
    required: true,
    validator: (value: string) => {
      return ['add', 'modify', 'view'].includes(value);
    }
  }
});

// Event to close dialog box
const event = defineEmits(['close']);
const panel = ref<string[]>([])
const loading = ref<boolean>(false)

const molDisplay = ref<tMolecule>();

//******* Show selected molecule
if(props.action !== 'add'){
  $fetch('/api/molecule/molecule?param=' + props.idMolecule)
    .then((response) => {
      if (typeof response === 'number') {
        // TODO manage error
        return;
      }
      molDisplay.value = response as tMolecule;
      
      // get equivalent molecule
      if (molDisplay.value.equivalent){
        $fetch('/api/molecule/molecule?param=' + molDisplay.value.equivalent)
          .then((response) => {
            if (typeof response === 'number') {
              // TODO manage error
              return;
            }
            molEquivalent.value = response;
          });
      }
    });
}
// ******Variables to manage the search of molecule
// Number of items per page
const molItemsPerPage = ref<number>(5);
// Page of table
const molPage = ref<number>(1);
// Search molecule
const searchMolecule = ref<string>('');
// List of molecule found
const itemMol = ref<any>([]);
// Header of table
const headerMol = [
  { title: 'ChEBIId', key: 'id' },
  { title: 'name', key: 'name' }
];
// Timeout to manage the search of molecule
let debounceTimeout: ReturnType<typeof setTimeout>;

// Part to manage the search of molecule in real time on ChEBI
watch(searchMolecule, (value) => {
  // start to search molecule after 3 characters
  if (value.length < 3) {
    return;
  }
  // clear the timeout if the user is still typing
  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    loading.value = true
    $fetch('/api/ChEBI?search=' + value)
      .then((response) => {
        loading.value = false
        // check no error
        if (typeof response === 'number') {
          // shom error messaeg
          return;
        }
        itemMol.value = response;
        // back to first page
        molPage.value = 1;
      });
  }, 300);
});
// Variable to get selected molecule
const itemMolSelected = ref<any>([]);
// Get all information on the molecule selected
watch(itemMolSelected, (value) => {
  $fetch('/api/ChEBI?id=' + value[0])
    .then((response) => {
      if (typeof response === 'number') {
        // TODO manage error
        return;
      }
      molDisplay.value = response as tMolecule;
      molDisplay.value.userSyns = [];
      // close molecule panel
      panel.value = [];
    })
});

// *** Variables to manage the synonyms
// Show synonyms but differenciate between synonyms from ChEBO and users
const listSynonyms = computed<{syn:string, icon:string, action:Function}[]>(() => {
    const userSyns = molDisplay.value?.userSyns ?? [];
    const synonyms = molDisplay.value?.synonyms ?? [];
    return [...userSyns, ...synonyms]
        .filter(syn => syn !== "")
        .map((syn) => {
            if (synonyms.includes(syn)) {
                return { syn: syn, icon: "mdi-lock", action: () => {} };
            } else {
                return { syn: syn, icon: "mdi-delete", action: removeSynonym };
            }
        });
});

// Variable to add new synonym
const newSynonym = ref<string>('');
// Rules to add synonym
const synRules = [
  (text: string) => !!text || t('message.required'),
  (text: string) => listSynonyms.value.filter((val) => val.syn == text).length == 0 || t('message.synonymExist')
];
// Variable to validate synonym
const validateSynonym = ref<boolean>(false);
/**
 * Add synonym to molecule
 */
function addSynonym() {
  // check two don't add the same synonym
  if (!validateSynonym.value) {
    return;
  }
  // add synonym in userSyns
  molDisplay.value.userSyns.push(newSynonym.value);
  // clear the field
  newSynonym.value = '';
}

/**
 * Remove synonym from molecule
 */
function removeSynonym(item:{ syn: string }) {
  // remove synonym from userSyns
  molDisplay.value.userSyns = molDisplay.value.userSyns.filter((syn) => syn !== item.syn);
}
// *** Variables to manage the search of equivalent molecule


/**
 * Define the title of dialog box
 */
function titleDialogBox(): string {
  if (props.action === 'add') {
    return t('title.addMolecule');
  } else if (props.action === 'modify') {
    return t('title.modifyMolecule');
  } else {
    return t('title.viewMolecule');
  }
}

//***** Manage equivalent molecule */

// Enable equivalent if there are molecule in database
const disabledEquivalents = ref<boolean>(true);
/**
 * Check if database contain molecule
 */
function checkMolecule(){
  $fetch('/api/molecule/check', {
    method: 'GET'
  })
  .then((response) => {    
    disabledEquivalents.value = !response;
  });
}
checkMolecule();

// variable to search equivalent molecule
const searchEquivalents = ref<string>('');
// variable to display equivalent molecule
const itemEquivalents = ref<any>([]);
// header of table
const headerEquivalents = ref([
  { title: 'name', key: 'name' },
  { title: 'formula', key: 'formula' },
  { title: 'mass', key: 'mass' }
]);
// Number of items per page
const equiItemsPerPage = ref<number>(5);
// Page of table
const equiPage = ref<number>(1);
/**
 * search molecule in database
 * @param search 
 */
 function searchInDatabase(search: string) {
  // query to search molecule
  $fetch('/api/molecule/search?param=' + search)
    .then((response) => {
      loading.value = false
      // check no error
      if (typeof response === 'number') {
        // shom error message
        return;
      }
      itemEquivalents.value = response.filter((val) => 
      val.name !== molDisplay.value.name);
      // back to first page
      equiPage.value = 1;
    });
}

watch(searchEquivalents, (value) => {
  // start to search molecule after 3 characters
  if (value.length < 3) {
    return;
  }
  // clear the timeout if the user is still typing
  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    loading.value = true
    searchInDatabase(value);
  }, 300);
});

// Variable to get selected equivalent molecule
const itemEquivalentsSelected = ref<tMolecule[]>([]);
// variable to display equivalent molecule
const molEquivalent = ref<tMolecule>();
// Add molecule in list of equivalent
watch(itemEquivalentsSelected, (value) => {
  // check value is not empty
  if( !value || value.length == 0){
    return;
  }
  // Change equivalent molecule
  molEquivalent.value = value[0] as tMolecule;
});
// Remove molecule from list of equivalent
function removeEquivalent(item: any) {
  molEquivalent.value = undefined;
}

/**
 * submit form: select function to call
 */
function submitForm() {
  if (props.action === 'add') {
    add();
  } else if (props.action === 'modify') {
    modify();
  }

  event('close');
}

/**
 * Add molecule
 */
function add() {
  // add molecule in database
  $fetch('/api/molecule/molecule', {
    method: 'POST',
    body: JSON.stringify({
      id: molDisplay.value.id,
      name: molDisplay.value.name,
      formula: molDisplay.value.formula,
      mass: molDisplay.value.mass,
      synonyms: (molDisplay.value?.synonyms || []),
      userSyns: (molDisplay.value?.userSyns || []),
      equivalent: molEquivalent?.value?.id || ''
    })
  })
  .then(() => {
    event('close');
  })
  .catch((error) => {
    // TODO manage error
  });
}
/**
 * Update molecule
 */
function modify() {
  // update molecule in database
  $fetch('/api/molecule/molecule', {
    method: 'PUT',
    body: JSON.stringify({
      id: molDisplay.value.id,
      name: molDisplay.value.name,
      formula: molDisplay.value.formula,
      mass: molDisplay.value.mass,
      synonyms: (molDisplay.value?.synonyms || []),
      userSyns: (molDisplay.value?.userSyns || []),
      equivalent: molEquivalent?.value?.id || ''
    })
  })
  .then((response) => {
    // manage error
    if (typeof response === 'number') {
      // request error
      return;
    }
    event('close');
  })
  .catch((error) => {
    // server error
    console.log(error);
    
  });
}

</script>

<template>
  <v-form
    validate-on="blur"
    persistent
    :disabled="props.action === 'view'"
    @submit.prevent="submitForm"
  >
    <v-card>
      <!-- title of dialog box about action -->
      <v-card-title class="d-flex justify-space-between">
        <span class="headline">{{ titleDialogBox() }}</span>
        <!-- button to close dialog box and cancel action -->
        <!-- TODO manage when we cancel msg confirmation-->
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="event('close')"
        />
      </v-card-title>
      <!-- Shom molecule -->
      <!-- its name -->
      <v-card-subtitle
        v-if="molDisplay"
        class="text-h4"
      >
        {{ molDisplay.name }}
      </v-card-subtitle>
      <!-- its formula and name -->
      <v-card-text v-if="molDisplay">
        {{ t('label.formula') }} : {{ molDisplay?.formula }}
        <br>
        {{ t('label.mass') }} : {{ molDisplay?.mass }}
        <br>
        <!-- {{ molDisplay.id }} -->
      </v-card-text>


      <v-expansion-panels v-model="panel">
        <!-- Tab where search and select molecule -->
        <v-expansion-panel
          v-if="props.action == 'add'"
          :title="t('title.molecule')"
        >
          <v-expansion-panel-text>
            <!-- field to indicate searched molecule -->
            <v-text-field
              v-model="searchMolecule"
              :label="t('label.search')"
              :loading="loading"
              required
            />
            <!-- Table to display found molecule -->
            <v-data-table-server
              v-model="itemMolSelected"
              v-model:items-per-page="molItemsPerPage"
              v-model:page="molPage"
              :headers="headerMol"
              :items="itemMol.slice(molItemsPerPage * (molPage - 1), molItemsPerPage * (molPage))"
              :items-length="itemMol.length"
              select-strategy="single"
              :items-per-page-options="[5, 10, 15]"
              :loading="loading"
              show-select
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <!-- Tab where define synonyms -->
        <v-expansion-panel
          :title="t('title.synonyms')"
          :disabled="molDisplay?.id === undefined"
        >
          <v-expansion-panel-text>
            <!-- field to add synonym -->
            <v-form 
              v-model="validateSynonym"
              @submit.prevent="addSynonym"
            >
              <v-text-field
                v-if="props.action != 'view'"
                v-model="newSynonym"
                :label="t('label.synonym')"
                required
                :rules="synRules"
              >
                <template #append>
                  <v-btn
                    type="submit"
                    variant="plain"
                    icon="mdi-plus"
                  />
                </template>
              </v-text-field>
            </v-form>
            <!-- Table to display synonyms -->
            <v-virtual-scroll 
              height="200"
              :items="listSynonyms"
              :item-height="5"
            >
              <template #default="{ item }">
                <v-list-item 
                  :title="item.syn"
                  :prepend-icon="item.icon"
                  :disabled="props.action === 'view'"
                  @click="item.action(item)"
                />
              </template>
            </v-virtual-scroll>
          </v-expansion-panel-text>
        </v-expansion-panel>
        <!-- Tab where define equivalent molecul -->
        <v-expansion-panel
          :title="t('title.equivalent')"
          :disabled="disabledEquivalents || molDisplay?.id === undefined"
        >
          <v-expansion-panel-text>
            <!-- field to indicate searched molecule -->
            <v-text-field
              v-if="props.action != 'view'"
              v-model="searchEquivalents"
              :label="t('label.search')"
              :loading="loading"
              required
            />
            <!-- Table to select equivalent enable in database -->
            <v-data-table-server
              v-if="props.action != 'view'"
              v-model="itemEquivalentsSelected"
              v-model:items-per-page="equiItemsPerPage"
              v-model:page="equiPage"
              :headers="headerEquivalents"
              :items="itemEquivalents.slice(equiItemsPerPage * (equiPage - 1), equiItemsPerPage * (equiPage))"
              :items-length="itemEquivalents.length"
              return-object
              :items-per-page-options="[5, 10, 15]"
              :loading="loading"
              show-select
              select-strategy="single"
            />
            <!-- Table show equivalents -->
            <v-card 
              v-if="molEquivalent"
              variant="plain"
            >
              <v-btn
                v-if="props.action !== 'view'"
                icon="mdi-delete"
                variant="plain"
                @click="removeEquivalent(molEquivalent)"
              />
              {{ molEquivalent.name }} : {{ molEquivalent.formula }}
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <!-- Button to save/close dialog box -->
      <v-btn
        v-if="props.action === 'view'"
        color="primary"
        :text="t('button.close')"
        type="submit"
      />
      <v-btn
        v-else-if="props.action === 'modify'"
        color="primary"
        :text="t('button.modify')"
        :disabled="!(molDisplay)"
        type="submit"
      />
      <v-btn
        v-else
        color="primary"
        :text="t('button.save')"
        type="submit"
        :disabled="!(molDisplay)"
      />
    </v-card>
  </v-form>
</template>