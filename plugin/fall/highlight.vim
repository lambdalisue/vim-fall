if exists('g:loaded_fall_highlight')
  finish
endif
let g:loaded_fall_highlight = 1

function! s:init() abort
  if has('nvim')
    highlight default link FallNormal FloatNormal
    highlight default link FallBorder FloatBorder
  else
    highlight default link FallNormal Normal
    highlight default link FallBorder StatusLineNC
  endif

  " Input
  highlight default link FallInputHeader FallBorder
  highlight default link FallInputCounter FallBorder
  highlight default link FallInputCursor Cursor

  " List
  highlight default link FallListMatch Search
  highlight default link FallListSelected CurSearch
  sign define FallListSelected text=≫
endfunction

augroup fall_plugin_highlight
  autocmd!
  autocmd ColorScheme * call s:init()
augroup END

call s:init()
