<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            autocomplete="off"
            v-model="ticker"
            @keydown.enter="add"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          class="flex bg-white p-1 rounded-md shadow-md flex-wrap"
          v-if="ticker.length"
          :class="{
            hidden: !activeHelpTickers.length
          }"
        >
          <span
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
            @click="addHelpTicker(tHelp)"
            v-for="tHelp in activeHelpTickers"
            v-bind:key="tHelp"
          >
            {{ tHelp }}
          </span>
        </div>

        <div class="text-sm text-red-600" v-if="checkDoubleTicker(ticker)">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <add-ticker-button @click="add" />
  </section>
</template>
<script>
import AddTickerButton from "./AddTickerButton.vue";
import { getFullHelpTickers } from "../api.js";
export default {
  components: {
    AddTickerButton
  },
  data() {
    return {
      ticker: "",
      dataHelpTickers: []
    };
  },
  props: {
    tickers: {
      type: Array,
      required: true
    }
  },
  emits: {
    "add-ticker": value => typeof value === "string" && !!value.length
  },
  async created() {
    this.dataHelpTickers = await getFullHelpTickers();
  },
  computed: {
    activeHelpTickers() {
      return this.dataHelpTickers
        .filter(item =>
          item.toLowerCase().startsWith(this.ticker.toLowerCase())
        )
        .sort((strFirst, strSecond) => {
          return strFirst.length - strSecond.length;
        })
        .slice(0, 4);
    }
  },
  methods: {
    addHelpTicker(helpTicker) {
      this.ticker = helpTicker;
      this.add();
    },
    add() {
      if (!this.ticker) return;
      if (this.checkDoubleTicker(this.ticker)) return;
      if (this.checkCorrectTicker(this.ticker)) return;
      this.$emit("add-ticker", this.ticker);
      this.ticker = "";
    },
    checkDoubleTicker(tickerName) {
      return (
        this.tickers.filter(
          t => t.name.toLowerCase() == tickerName.toLowerCase()
        ).length > 0
      );
    },
    checkCorrectTicker(tickerName) {
      return !(
        this.dataHelpTickers.filter(
          t => t.toLowerCase() == tickerName.toLowerCase()
        ).length > 0
      );
    }
  }
};
</script>
