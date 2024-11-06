function! fall#action(name) abort
  call fall#internal#dispatch(#{type: 'action-invoke', name: a:name})
endfunction
