#include <mobipanda.hpp>

// create new nft, if max_supply.amount == 0, means infinite supply.
ACTION mobipanda::create(name issuer, asset max_supply, int typ) {
  require_auth(_self);

  // Check if issuer account exists
  eosio_assert(is_account(issuer), "issuer account does not exist");

  // Valid maximum supply symbol
  eosio_assert(max_supply.symbol.is_valid(), "invalid symbol name");

  // check token type
  eosio_assert(typ == 0 || typ == 1,
               "invalid token type: should be `0` or `1`");
  if (typ == 1) {
    eosio_assert(max_supply.symbol.precision() == 0,
                 "max_supply must be a whole number");
  }

  // Check if currency with symbol already exists
  auto sym_code = max_supply.symbol.code().raw();
  // stat_index currency_table(_self, _self.value);
  auto existing_currency = stats.find(sym_code);
  eosio_assert(existing_currency == stats.end(),
               "token with symbol already exists");

  // Create new currency
  stats.emplace(_self, [&](auto& currency) {
    currency.supply = asset(0, max_supply.symbol);
    // if max_supply.amount == 0, means infinite supply.
    if (max_supply.amount == 0) {
      currency.infinite = true;
    }
    currency.issued = currency.supply;
    //currency.pubkey = _self;
    currency.max_supply = max_supply;
    currency.issuer = issuer;
    currency.type = typ;
  });
}

ACTION mobipanda::issuenft(name to, string symbol, string memo) {
  eosio_assert(is_account(to), "to account does not exist");
  // e,g, Get EOS from 3 EOS
  auto sym = eosio::symbol(symbol.c_str(), 0);
  auto quantity = asset{1, sym};
  eosio_assert(sym.is_valid(), "invalid symbol name");
  eosio_assert(sym.precision() == 0, "quantity must be a whole number");
  //eosio_assert(memo.size() == 32, "memo not equals 256 bytes");
  //unsigned char geneId[32];
  //strcpy(geneId, memo.c_str());
  //memo.copy(geneId, 31);

  // Ensure currency has been created
  auto sym_code = sym.code().raw();
  stat_index statstable(_self, _self.value);
  const auto& st = stats.get(
      sym_code, "token with symbol does not exist. create token before issue");
  eosio_assert(st.type == 1, "this is fungible token, canno be issue as nft");
  // Ensure have issuer authorization and valid quantity
  require_auth(st.issuer);

  // Increase supply
  stats.modify(st, same_payer, [&](auto& s) { s.issued += quantity; });

  add_supply(quantity);

  // Mint nfts
  mint(to, _self, asset(1, sym), memo);
  //for (int i = 0; i < uris.size(); i++) {
  //  mint(to, to, 0, asset(1, sym), uris[i], signature{});
  //}
  // Add balance to account
  add_balance(to, quantity, _self);
}

ACTION mobipanda::transfernft(name from, name to, id_type id, string memo) {
  // Ensure authorized to send from account
  eosio_assert(from != to, "cannot transfer to self");
  require_auth(from);

  // Ensure 'to' account exists
  eosio_assert(is_account(to), "to account does not exist");

  // Check memo size and print
  eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");

  // Ensure token ID exists
  //auto uuid_index = tokens.get_index<"byuuid"_n>();
  const auto& st =
      pandas.get(id, "token with specified ID does not exist");

  // Ensure owner owns token
  eosio_assert(st.owner == from, "sender does not own token with specified ID");

  // Notify both recipients
  require_recipient(from);
  require_recipient(to);

  // Transfer NFT from sender to receiver
  pandas.modify(st, from, [&](auto& token) { token.owner = to; });

  // Change balance of both accounts
  sub_balance(from, st.value);
  add_balance(to, st.value, _self);
}

void mobipanda::sub_balance(name owner, asset value) {
  account_index from_acnts(_self, owner.value);
  const auto& from =
      from_acnts.get(value.symbol.code().raw(), "no balance object found");
  eosio_assert(from.balance.amount >= value.amount, "overdrawn balance");

  if (from.balance.amount == value.amount) {
    from_acnts.erase(from);
  } else {
    from_acnts.modify(from, same_payer, [&](auto& a) { a.balance -= value; });
  }
}

void mobipanda::add_balance(name owner, asset value, name ram_payer) {
  account_index to_accounts(_self, owner.value);
  auto to = to_accounts.find(value.symbol.code().raw());
  if (to == to_accounts.end()) {
    to_accounts.emplace(ram_payer, [&](auto& a) { a.balance = value; });
  } else {
    to_accounts.modify(to, ram_payer, [&](auto& a) { a.balance += value; });
  }
}

void mobipanda::sub_supply(asset quantity) {
  auto sym_code = quantity.symbol.code().raw();
  eosio_assert(quantity.is_valid(), "invalid quantity");
  eosio_assert(quantity.amount > 0, "must issue positive quantity");

  //stat_index currency_table(_self, _self.value);
  const auto& st = stats.get(sym_code, "asset dose not exist");
  eosio_assert(st.supply >= quantity, "nft supply is not enough");
  stats.modify(st, same_payer,
                  [&](auto& currency) { currency.supply -= quantity; });
}

void mobipanda::add_supply(asset quantity) {
  auto sym_code = quantity.symbol.code().raw();
  eosio_assert(quantity.is_valid(), "invalid quantity");
  eosio_assert(quantity.amount > 0, "must issue positive quantity");

  const auto& st = stats.get(sym_code, "asset does not exist");
  eosio_assert(st.infinite || st.issued + quantity < st.max_supply,
                "quantity should not be more than maximum supply");
  stats.modify(st, same_payer,
                [&](auto& currency) { currency.supply += quantity; });
}

void mobipanda::mint(name owner, name ram_payer, asset value, string gene) {
  uint64_t tid = pandas.available_primary_key();
  //if (uuid == 0) {
  //  uuid = get_global_id(_self, tid);
  //}
  //auto uuid_index = tokens.get_index<"byuuid"_n>();
  auto exist = pandas.find(tid);
  eosio_assert(exist == pandas.end(), "nft has exist");

  // Add token with creator paying for RAM
  pandas.emplace(ram_payer, [&](auto& panda) {
    panda.id = tid;
    ///token.uuid = uuid;
    //token.uri = uri;
    panda.owner = owner;
    panda.value = value;
    panda.gene = gene;
    //token.sign = sign;
  });
}


EOSIO_DISPATCH(mobipanda, (create)(issuenft)(transfernft))
