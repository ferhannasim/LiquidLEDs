if (!customElements.get('product-inventory')) {
  class ProductInventory extends HTMLElement {
    constructor() {
      super();
      window.initLazyScript(this, this.initLazySection.bind(this));
    }

    initLazySection() {
      this.inventoryNotice = this.querySelector('.js-inventory-notice');
      this.urgencyMessage = this.querySelector('.js-inventory-urgency');
      this.indicatorBar = this.querySelector('.js-inventory-indicator');
      this.variantInventory = this.getVariantInventory();

      // Bind to on:variant:change event for this product
      const variantPicker = this.closest('.product-info').querySelector('variant-picker');
      if (variantPicker) {
        variantPicker.addEventListener('on:variant:change', this.handleVariantChange.bind(this));
      }

      // Init
      this.updateInventory(
        parseInt(this.dataset.inventoryQuantity, 10),
        this.dataset.variantAvailable === 'true'
      );

      // Note: Removed unused moment() call - result was never used
      var todayDates = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" });

      var usaTime = new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" });
      var now = new Date(usaTime);
      var deliveryDate = new Date(usaTime);

      var business_days = 0;
      var hour_deadline = 10;
      var todayWeekDay = now.getDay();

      var usaTime = new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" });
      var d = new Date(usaTime);
      var currentWeekDay = d.getDay();
      var today_date = d.getDate();
      var hastime = true;
      var days = 0;
      if (currentWeekDay == 6) {
        days = 2;
      } else if (currentWeekDay == 0) {
        days = 1;
      } else if (currentWeekDay == 5) {
        if (d.getHours() >= hour_deadline) {
          days = 3;
        }
      } else {
        if (d.getHours() >= hour_deadline) {
          days = 1;
        }
      }

      Date.prototype.addDays = function (days) {
        var usaTime = new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" });
        var d = new Date(usaTime);
        this.setDate(d.getDate() + parseInt(days));
        return this;
      };
      Date.prototype.getWeekDay = function () {
        var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return weekday[this.getDay()];
      }

      var currentDate = d;
      var res = currentDate.addDays(days);
      res = res.getDate();
      var curr_month = d.getMonth();
      curr_month++;
      var curr_year = d.getFullYear();

      var countDownDate = new Date('' + curr_month + '/' + res + '/' + curr_year + ' ' + '10:00:00');
      var updatedCountDownDate = countDownDate;

      var usaTime = new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" });
      var now = new Date(usaTime);

      var distance = updatedCountDownDate - now;
      var days = Math.floor(distance / (1000 * 60 * 60 * 24));
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      var weekday = new Date(new Date('' + curr_month + '/' + res + '/' + curr_year + ' ')).getWeekDay();
      var html = "Order within <span class='time-left'>" + (hours + (days * 24)) + " hrs " + minutes + " min</span> to ship " + weekday;
      var shippingTimeEl = document.getElementById('shipping-time');
      if (shippingTimeEl) shippingTimeEl.innerHTML = html;
    }

    /**
     * Gets the inventory data for all product variants
     * @returns {?object}
     */
    getVariantInventory() {
      const dataEl = this.querySelector('[type="application/json"]');
      return this.variantInventory || JSON.parse(dataEl.textContent);
    }

    /**
     * Handles a 'change' event on the variant picker element
     * @param {object} evt - Event object
     */
    handleVariantChange(evt) {
      if (evt.detail.variant) {
        const inventory = this.variantInventory.filter(
          (variant) => variant.id === evt.detail.variant.id
        )[0];
        this.updateInventory(inventory.inventory_quantity, inventory.available);
        this.customUpdateStock(inventory);
      } else {
        this.updateInventory(0, false);
        this.hidden = true;
      }
    }

    /**
     *
     * Updates the inventory notice
     * @param {number} count - the inventory quantity available
     * @param {boolean} available - whether current variant is available
     */
    updateInventory(count, available) {
      let inventoryLevel;
      if (count <= 0) {
        if (available) {
          inventoryLevel = 'in_stock';
        } else {
          inventoryLevel = 'none';
        }
      } else if (count <= parseInt(this.dataset.thresholdVeryLow, 10)) {
        inventoryLevel = 'very_low';
      } else if (count <= parseInt(this.dataset.thresholdLow, 10)) {
        inventoryLevel = 'low';
      } else {
        inventoryLevel = 'normal';
      }

      if (this.dataset.showNotice === 'always'
        || (this.dataset.showNotice === 'low' && inventoryLevel.includes('low'))) {
        this.hidden = false;

        // Set the inventory level data attribute
        this.setAttribute('data-inventory-level', inventoryLevel);

        // Determine whether to show the count or not
        if (inventoryLevel !== 'in_stock' && (this.dataset.showCount === 'always' || (this.dataset.showCount === 'low' && inventoryLevel.includes('low')))) {
          if (count > 100) {
            this.inventoryNotice.innerText = theme.strings.onlyXLeft.replace('[quantity]', '100+');
          } else if (count < 100 && count > 50) {
            this.inventoryNotice.innerText = theme.strings.onlyXLeft.replace('[quantity]', '50+');
          } else {
            this.inventoryNotice.innerText = theme.strings.onlyXLeft.replace('[quantity]', count);
          }
        } else if (inventoryLevel.includes('low')) {
          this.inventoryNotice.innerText = theme.strings.lowStock;
        } else if (inventoryLevel === 'normal' || inventoryLevel === 'in_stock') {
          this.inventoryNotice.innerText = theme.strings.inStock;
        } else if (inventoryLevel === 'none') {
          this.inventoryNotice.innerText = theme.strings.noStock;
        }

        // Update urgency message if needed
        if (this.urgencyMessage) {
          if (inventoryLevel === 'very_low') {
            this.urgencyMessage.innerHTML = this.dataset.textVeryLow;
          } else if (inventoryLevel === 'low') {
            this.urgencyMessage.innerHTML = this.dataset.textLow;
          } else if (inventoryLevel === 'normal' || inventoryLevel === 'in_stock') {
            this.urgencyMessage.innerHTML = this.dataset.textNormal;
          } else if (inventoryLevel === 'none') {
            this.urgencyMessage.innerHTML = this.dataset.textNoStock;
          }
        }

        // Update the bar indicator
        if (this.indicatorBar) {
          this.indicatorBar.hidden = false;

          let newWidth;
          if (count >= this.dataset.scale || inventoryLevel === 'in_stock') {
            newWidth = 100;
          } else {
            newWidth = ((100 / parseInt(this.dataset.scale, 10)) * count).toFixed(1);
          }
          this.indicatorBar.querySelector('span').style.width = `${newWidth}%`;
        }
      } else {
        this.hidden = true;
      }
    }

    customUpdateStock(availableVariants) {
      var availHTML = "";

      // Helper functions to replace jQuery
      function hideCheckoutBtn() {
        document.querySelectorAll('.dynamic_checkout_btn').forEach(function (el) { el.classList.add('hidden'); });
      }
      function showCheckoutBtn() {
        document.querySelectorAll('.dynamic_checkout_btn').forEach(function (el) { el.classList.remove('hidden'); });
      }
      function hideShippingTime() {
        var shippingEl = document.getElementById('shipping-time');
        if (shippingEl && shippingEl.parentElement) shippingEl.parentElement.classList.add('hidden');
      }
      function showShippingTime() {
        var shippingEl = document.getElementById('shipping-time');
        if (shippingEl && shippingEl.parentElement) shippingEl.parentElement.classList.remove('hidden');
      }

      if (availableVariants) {
        if (availableVariants.inventory_management == "shopify") {
          if (availableVariants.inventory_quantity < 10 && availableVariants.inventory_quantity > 0) {
            availHTML = " ";
          } else if (availableVariants.inventory_quantity <= 0 && availableVariants.inventory_policy == "continue") {
            if (availableVariants.next_incoming_date) {
              availHTML = "<span>Due In Stock " + availableVariants.next_incoming_date + "</span>";
            } else {
              availHTML = "<span></span>";
            }
          } else if (availableVariants.inventory_quantity <= 0 && availableVariants.inventory_policy == "deny") {
            if (availableVariants.next_incoming_date) {
              hideCheckoutBtn();
              hideShippingTime();
              availHTML = "<span>Due In Stock " + availableVariants.next_incoming_date + "</span>";
            } else {
              console.log('de else');
              hideShippingTime();
              availHTML = "<span> </span>";
            }
          } else {
            if (availableVariants.available == false) {
              hideCheckoutBtn();
              hideShippingTime();
            } else {
              showCheckoutBtn();
              showShippingTime();
            }
          }
        } else {
          if (availableVariants.available == false) {
            availHTML = " ";
          } else {
            showCheckoutBtn();
            availHTML = " ";
          }
        }
      }
      document.querySelectorAll('.backorder_date .change_content').forEach(function (el) {
        el.setAttribute('data-max', availableVariants.inventory_quantity);
        el.innerHTML = availHTML;
      });
    }
  }

  customElements.define('product-inventory', ProductInventory);
}