function! fall#setup(params) abort
  call denops#plugin#wait_async(
        \ "fall",
        \ { -> denops#notify("fall", "setup", [a:params]) },
        \)
endfunction

function! fall#start(name, options) abort
  call denops#plugin#wait_async(
        \ "fall",
        \ { -> denops#notify("fall", "start", [a:name, a:options]) },
        \)
endfunction

function! fall#action(name) abort
  call denops#plugin#wait_async(
        \ "fall",
        \ { -> denops#notify("fall", "actionInvoke", [a:name]) },
        \)
endfunction
