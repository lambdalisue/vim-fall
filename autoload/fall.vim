function! fall#start(name, args, options) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'start', [a:name, a:args, a:options]) },
        \)
endfunction

function! fall#action(name) abort
  call denops#plugin#wait_async(
        \ 'fall',
        \ { -> denops#notify('fall', 'dispatch', ['action-invoke', a:name]) },
        \)
endfunction
