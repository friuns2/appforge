
Vue.component('recursive-settings', {
    template: `        
    <div>
      <div v-for="(value, key) in settings" :key="key">
        <div v-if="typeof value === 'boolean'" class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">{{ key }}</span>
            <input type="checkbox" class="toggle" v-model="settings[key]" @change="$emit('save-settings')">
          </label>
        </div>
        <div v-else-if="typeof value?.selected !== 'undefined'" class="form-control">
          <label class="label">
            <span class="label-text">{{ key }}</span>
          </label>
          <select class="select select-bordered" :id="'select-' + key" v-model="settings[key].selected" @change="$emit('save-settings')">
            <option value="" selected>Default ({{key}})</option>
            <option v-for="(option, index) in settings[key].options">{{ Array.isArray(settings[key].options) ? option : index }}</option>
          </select>
          <button class="btn btn-xs mt-2" @click="addNewOption(settings[key])">+</button>
        </div>
        <div v-else-if="Array.isArray(value) && typeof value[0] === 'string'" class="collapse">
          <input type="checkbox" :id="key" />
          <label :for="key" class="collapse-title text-xl font-medium">{{ key }}</label>
          <div class="collapse-content">
            <p v-if="value.length === 0">No strings added.</p>
            <div v-else v-for="(item, index) in value" :key="index" class="input-group my-2">
              <input type="text" class="input input-bordered" v-model="settings[key][index]" @input="$emit('save-settings')" />
              <button class="btn btn-square" @click="value.splice(index, 1)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <button class="btn btn-xs mt-2" @click="value.push('')">Add String</button>
          </div>
        </div>
        <div v-else-if="Array.isArray(value) && typeof value[0] === 'object'" class="collapse">
          <input type="checkbox" :id="key" />
          <label :for="key" class="collapse-title text-xl font-medium">{{ key }}</label>
          <div class="collapse-content">
            <p v-if="value.length === 0">No objects added.</p>
            <div v-for="(item, index) in value" :key="index" class="collapse nested-settings">
              <input type="checkbox" :id="'nested-' + index" />
              <label :for="'nested-' + index" class="collapse-title">
                <span class="truncate">{{ item.name ?? item.title ?? Object.values(item)[0] }}</span>
              </label>
              <div class="collapse-content">
                <recursive-settings :settings="item" @save-settings="$emit('save-settings')"></recursive-settings>
                <button class="btn btn-xs mt-2" @click="duplicateItem(value, index)">Duplicate</button>
                <button class="btn btn-xs mt-2" @click="deleteItem(value, index)">Delete</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="typeof value === 'object'" class="collapse">
          <input type="checkbox" :id="key" />
          <label :for="key" class="collapse-title text-xl font-medium">{{ value?.name ?? key }}</label>
          <div class="collapse-content">
            <recursive-settings :settings="value" @save-settings="$emit('save-settings')"></recursive-settings>
          </div>
        </div>
        <div v-else class="form-control">
          <label class="label">
            <span class="label-text">{{ key }}</span>
          </label>
          <textarea class="textarea textarea-bordered h-24" :id="'textarea-' + key" v-model="settings[key]" @input="$emit('save-settings')"></textarea>
        </div>
      </div>
    </div>
  `,
    props: ['settings'],
    created() {
      //recursive
    },
    methods: {
      duplicateItem(array, index) {
          var value = prompt("Please enter a name:");
          if (!value) return;
          const newItem = JSON.parse(JSON.stringify(array[index]));
          newItem.title = value;
          array.splice(index + 1, 0, newItem);
          this.Save();
        }, 
        deleteItem(array, index) {
          array.splice(index, 1);
          this.Save();
        },
      addNewOption(setting) {
        var value = prompt("Please enter a value:");
        if (!value) return;
        setting.options.push(value);
        setting.selected = value;
        this.Save();
      },
      Save(){
        this.$emit('save-settings');
        this.$forceUpdate();
      }

    }
  });